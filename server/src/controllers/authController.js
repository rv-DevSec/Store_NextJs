const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config');
const LoginLog = require('../models/LoginLog');
const { validateEmailDomain } = require('../middlewares/validateEmail');
const { normalizePhone, isValidPhone } = require('../utils/validatePhone');
const smsService = require('../services/smsService');
const { AppError } = require('../middlewares/errorHandler');

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const signAccessToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn || '15m',
  });
};

const generateRefreshToken = async (userId) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

  await User.findByIdAndUpdate(userId, {
    $push: {
      refreshTokens: {
        $each: [{ token: hashed, createdAt: new Date() }],
        $slice: -20,
      },
    },
  });

  return rawToken;
};

const buildAuthResponse = (user, accessToken, refreshToken) => ({
  success: true,
  token: accessToken,
  refreshToken,
  user: {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    role: user.role,
  },
});

/**
 * Build the phone-verification fields for a given phone number.
 *
 * When SMS verification is enabled a random code is issued and handed to the
 * SMS provider; the account is created in an unverified state and the code must
 * be confirmed via `POST /auth/verify-phone`. Otherwise the phone is treated as
 * verified so the account is immediately usable.
 */
const buildPhoneVerificationFields = async (phone) => {
  if (config.smsVerificationEnabled) {
    const code = String(crypto.randomInt(100000, 1000000));
    await smsService.sendVerificationCode(phone, code);
    return {
      phoneVerified: false,
      phoneVerifiedAt: null,
      phoneVerificationCode: crypto.createHash('sha256').update(code).digest('hex'),
      phoneVerificationCodeExpire: new Date(Date.now() + config.smsVerificationCodeTtlMinutes * 60 * 1000),
    };
  }
  return {
    phoneVerified: true,
    phoneVerifiedAt: new Date(),
    phoneVerificationCode: null,
    phoneVerificationCodeExpire: null,
  };
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { name, username, email, phone, password } = req.body;

    if (!username) {
      return next(new AppError('نام کاربری الزامی است', 400));
    }

    if (!phone) {
      return next(new AppError('شماره موبایل الزامی است', 400));
    }
    if (!isValidPhone(phone)) {
      return next(new AppError('شماره موبایل معتبر نیست', 400));
    }
    const normalizedPhone = normalizePhone(phone);

    if (email && !validateEmailDomain(email)) {
      return next(new AppError('ایمیل معتبر نیست', 400));
    }

    const existingUser = await User.findOne({
      $or: [{ username }, ...(email ? [{ email }] : []), { phone: normalizedPhone }],
    });
    if (existingUser) {
      return next(new AppError('کاربری با این نام کاربری، ایمیل یا شماره موبایل قبلاً ثبت‌نام کرده است', 400));
    }

    const phoneVerification = await buildPhoneVerificationFields(normalizedPhone);
    const user = await User.create({
      name,
      username,
      email: email || undefined,
      phone: normalizedPhone,
      password,
      ...phoneVerification,
    });
    const accessToken = signAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    res.status(201).json(buildAuthResponse(user, accessToken, refreshToken));
  } catch (err) {
    next(err);
  }
};

exports.registerSeller = async (req, res, next) => {
  try {
    const { name, username, phone, password } = req.body;

    if (!name || !username || !password) {
      return next(new AppError('نام، نام کاربری و رمز عبور الزامی است', 400));
    }
    if (password.length < 6) {
      return next(new AppError('رمز عبور باید حداقل ۶ کاراکتر باشد', 400));
    }
    if (!phone) {
      return next(new AppError('شماره موبایل الزامی است', 400));
    }
    if (!isValidPhone(phone)) {
      return next(new AppError('شماره موبایل معتبر نیست', 400));
    }
    const normalizedPhone = normalizePhone(phone);

    const existing = await User.findOne({
      $or: [{ username }, { phone: normalizedPhone }],
    });
    if (existing) {
      return next(new AppError('نام کاربری یا شماره موبایل قبلاً ثبت‌شده است', 400));
    }

    const phoneVerification = await buildPhoneVerificationFields(normalizedPhone);
    const user = await User.create({
      name, username, phone: normalizedPhone, password,
      role: 'seller',
      isActive: false,
      ...phoneVerification,
    });

    res.status(201).json({
      success: true,
      message: 'ثبت‌نام فروشنده با موفقیت انجام شد. پس از تأیید مدیر می‌توانید وارد شوید.',
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { username, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    if (!username) {
      return next(new AppError('نام کاربری الزامی است', 400));
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      LoginLog.create({ email: username, ip, userAgent, status: 'failed', failReason: 'wrong_password' }).catch(() => {});
      return next(new AppError('نام کاربری یا رمز عبور اشتباه است', 401));
    }

    if (!user.isActive) {
      LoginLog.create({ user: user._id, email: username, role: user.role, ip, userAgent, status: 'failed', failReason: 'inactive' }).catch(() => {});
      return next(new AppError('حساب کاربری شما غیرفعال شده است', 403));
    }

    // Clean expired refresh tokens
    const cutoff = new Date(Date.now() - REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    user.refreshTokens = user.refreshTokens.filter((t) => t.createdAt > cutoff);
    await user.save();

    const accessToken = signAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    LoginLog.create({ user: user._id, email: username, role: user.role, ip, userAgent, status: 'success' }).catch(() => {});

    res.json(buildAuthResponse(user, accessToken, refreshToken));
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('کاربر یافت نشد', 404));
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, username, email, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return next(new AppError('کاربر یافت نشد', 404));
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return next(new AppError('نام نمی‌تواند خالی باشد', 400));
      user.name = trimmed;
    }

    if (username !== undefined) {
      const uname = String(username).trim();
      if (!uname) return next(new AppError('نام کاربری نمی‌تواند خالی باشد', 400));
      if (uname !== user.username) {
        const dup = await User.findOne({ username: uname, _id: { $ne: user._id } }).lean();
        if (dup) return next(new AppError('این نام کاربری قبلاً استفاده شده است', 400));
        user.username = uname;
      }
    }

    if (email !== undefined) {
      const em = email ? String(email).trim().toLowerCase() : '';
      if (em) {
        if (!validateEmailDomain(em)) return next(new AppError('ایمیل معتبر نیست', 400));
        const dup = await User.findOne({ email: em, _id: { $ne: user._id } }).lean();
        if (dup) return next(new AppError('این ایمیل قبلاً ثبت شده است', 400));
      }
      user.email = em || undefined;
    }

    if (phone !== undefined) {
      const ph = String(phone).trim();
      if (ph && !isValidPhone(ph)) return next(new AppError('شماره موبایل معتبر نیست', 400));
      const normalized = ph ? normalizePhone(ph) : '';
      if (normalized && normalized !== user.phone) {
        const dup = await User.findOne({ phone: normalized, _id: { $ne: user._id } }).lean();
        if (dup) return next(new AppError('این شماره موبایل قبلاً ثبت شده است', 400));
        user.phone = normalized;
        // Phone changed → phone must be verified again
        const verification = await buildPhoneVerificationFields(normalized);
        Object.assign(user, verification);
      } else if (!normalized && user.phone) {
        user.phone = undefined;
        user.phoneVerified = false;
        user.phoneVerifiedAt = null;
        user.phoneVerificationCode = null;
        user.phoneVerificationCodeExpire = null;
      }
    }

    if (newPassword) {
      if (!currentPassword) return next(new AppError('رمز عبور فعلی الزامی است', 400));
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return next(new AppError('رمز عبور فعلی اشتباه است', 400));
      if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
        return next(new AppError('رمز عبور جدید باید حداقل ۸ کاراکتر با یک حرف انگلیسی و یک عدد باشد', 400));
      }
      user.password = newPassword;
    }

    await user.save();
    const updated = await User.findById(user._id);
    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
};

exports.verifyPhone = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return next(new AppError('کد تأیید را وارد کنید', 400));

    const user = await User.findById(req.user._id).select('+phoneVerificationCode +phoneVerificationCodeExpire');
    if (!user) return next(new AppError('کاربر یافت نشد', 404));

    if (!user.phoneVerificationCode || !user.phoneVerificationCodeExpire) {
      return next(new AppError('کد تأیید برای این شماره صادر نشده است', 400));
    }
    if (user.phoneVerificationCodeExpire < new Date()) {
      return next(new AppError('کد تأیید منقضی شده است. لطفاً دوباره درخواست دهید.', 400));
    }

    const hashed = crypto.createHash('sha256').update(String(code)).digest('hex');
    const expected = Buffer.from(user.phoneVerificationCode, 'hex');
    const actual = Buffer.from(hashed, 'hex');
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return next(new AppError('کد تأیید اشتباه است', 400));
    }

    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date();
    user.phoneVerificationCode = null;
    user.phoneVerificationCodeExpire = null;
    await user.save();

    const updated = await User.findById(user._id);
    res.json({ success: true, message: 'شماره موبایل تأیید شد', user: updated });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('ایمیل خود را وارد کنید', 400));
    if (!validateEmailDomain(email)) return next(new AppError('ایمیل معتبر نیست', 400));

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: 'اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی ارسال خواهد شد',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;

    res.json({
      success: true,
      message: 'اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی ارسال خواهد شد',
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('توکن بازیابی ارسال نشده است', 400));
    }

    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Rotate: remove old token first
    const result = await User.findOneAndUpdate(
      { 'refreshTokens.token': hashed },
      { $pull: { refreshTokens: { token: hashed } } },
      { new: true }
    );

    if (!result) {
      return next(new AppError('توکن بازیابی نامعتبر است', 401));
    }

    // Then issue new token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newHashed = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    await User.findByIdAndUpdate(result._id, {
      $push: { refreshTokens: { token: newHashed, createdAt: new Date() } },
    });

    const finalAccessToken = signAccessToken(result._id);

    res.json({
      success: true,
      token: finalAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await User.updateOne(
        { _id: req.user._id },
        { $pull: { refreshTokens: { token: hashed } } }
      );
    } else {
      // Logout from all devices
      await User.updateOne(
        { _id: req.user._id },
        { $set: { refreshTokens: [] } }
      );
    }
    res.json({ success: true, message: 'خروج موفقیت‌آمیز' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return next(new AppError('رمز عبور باید حداقل ۸ کاراکتر باشد', 400));
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return next(new AppError('رمز عبور باید حداقل یک حرف انگلیسی و یک عدد داشته باشد', 400));
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
      isActive: true,
    });

    if (!user) {
      return next(new AppError('لینک بازیابی نامعتبر یا منقضی شده است', 400));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const accessToken = signAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر یافت',
      token: accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};
