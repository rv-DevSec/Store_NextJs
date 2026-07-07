const rateLimit = require('express-rate-limit');

exports.loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'تعداد درخواست‌های ورود بیش از حد مجاز است. لطفاً یک دقیقه بعد تلاش کنید' },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { success: false, message: 'تعداد درخواست‌های ثبت‌نام بیش از حد مجاز است. لطفاً یک دقیقه بعد تلاش کنید' },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'تعداد درخواست‌های بازیابی رمز عبور بیش از حد مجاز است' },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.resetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'تعداد درخواست‌های بازنشانی رمز عبور بیش از حد مجاز است' },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'تعداد درخواست‌های بازیابی توکن بیش از حد مجاز است' },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'تعداد درخواست‌ها بیش از حد مجاز است' },
  standardHeaders: true,
  legacyHeaders: false,
});
