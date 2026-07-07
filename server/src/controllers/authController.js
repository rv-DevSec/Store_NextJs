const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config');
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
        token: hashed,
        createdAt: new Date(),
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
    email: user.email,
    phone: user.phone,
    role: user.role,
  },
});

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, ...(phone ? [{ phone }] : [])],
    });
    if (existingUser) {
      return next(new AppError('کاربری با این ایمیل یا شماره موبایل قبلاً ثبت‌نام کرده است', 400));
    }

    const user = await User.create({ name, email, phone, password });
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

    const existing = await User.findOne({
      $or: [{ username }, ...(phone ? [{ phone }] : [])],
    });
    if (existing) {
      return next(new AppError('نام کاربری یا شماره موبایل قبلاً ثبت‌شده است', 400));
    }

    const user = await User.create({
      name, username, phone, password,
      role: 'seller',
      isActive: false,
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

    const { email, password, username } = req.body;

    const user = await User.findOne(username ? { username } : { email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('ایمیل یا رمز عبور اشتباه است', 401));
    }

    if (!user.isActive) {
      return next(new AppError('حساب کاربری شما غیرفعال شده است', 403));
    }

    // Clean expired refresh tokens
    const cutoff = new Date(Date.now() - REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    user.refreshTokens = user.refreshTokens.filter((t) => t.createdAt > cutoff);
    await user.save();

    const accessToken = signAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('ایمیل خود را وارد کنید', 400));

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
    console.log(`\n🔐 Password reset link: ${resetUrl}\n`);

    res.json({
      success: true,
      message: 'اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی ارسال خواهد شد',
      ...(process.env.NODE_ENV !== 'production' && { resetUrl }),
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
