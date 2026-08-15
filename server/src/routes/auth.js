const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, verifyPhone, forgotPassword, resetPassword, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { loginLimiter, registerLimiter, forgotLimiter, resetLimiter, refreshLimiter } = require('../middlewares/rateLimiter');
const { validateEmailDomain } = require('../middlewares/validateEmail');
const { isValidPhone } = require('../utils/validatePhone');
const validate = require('../middlewares/validate');

router.post(
  '/register',
  registerLimiter,
  [
    body('name').notEmpty().withMessage('نام الزامی است').isLength({ max: 100 }).withMessage('نام حداکثر ۱۰۰ کاراکتر'),
    body('username').notEmpty().withMessage('نام کاربری الزامی است').isLength({ max: 40 }).withMessage('نام کاربری حداکثر ۴۰ کاراکتر'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('ایمیل معتبر نیست').custom((email) => {
      if (!validateEmailDomain(email)) {
        throw new Error('ایمیل معتبر نیست');
      }
      return true;
    }),
    body('phone').notEmpty().withMessage('شماره موبایل الزامی است').custom((value) => {
      if (!isValidPhone(value)) {
        throw new Error('شماره موبایل معتبر نیست');
      }
      return true;
    }),
    body('password')
      .isLength({ min: 8 }).withMessage('رمز عبور باید حداقل ۸ کاراکتر باشد')
      .matches(/[a-zA-Z]/).withMessage('رمز عبور باید حداقل یک حرف انگلیسی داشته باشد')
      .matches(/\d/).withMessage('رمز عبور باید حداقل یک عدد داشته باشد'),
  ],
  register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('username').notEmpty().withMessage('نام کاربری الزامی است').isLength({ max: 40 }).withMessage('نام کاربری حداکثر ۴۰ کاراکتر'),
    body('password').notEmpty().withMessage('رمز عبور الزامی است'),
  ],
  login
);

router.post('/refresh-token', refreshLimiter, refreshToken);
router.post('/logout', protect, logout);

router.get('/me', protect, getMe);

router.put('/me', protect, [  body('name').optional().notEmpty().withMessage('نام نمی‌تواند خالی باشد'),
  body('username').optional().notEmpty().withMessage('نام کاربری نمی‌تواند خالی باشد'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('ایمیل معتبر نیست').custom((email) => {
    if (!validateEmailDomain(email)) {
      throw new Error('ایمیل معتبر نیست');
    }
    return true;
  }),
  body('phone').optional({ values: 'falsy' }).custom((value) => {
    if (!isValidPhone(value)) {
      throw new Error('شماره موبایل معتبر نیست');
    }
    return true;
  }),
  body('newPassword').optional()
    .isLength({ min: 8 }).withMessage('رمز عبور جدید باید حداقل ۸ کاراکتر باشد')
    .matches(/[a-zA-Z]/).withMessage('رمز عبور جدید باید حداقل یک حرف انگلیسی داشته باشد')
    .matches(/\d/).withMessage('رمز عبور جدید باید حداقل یک عدد داشته باشد'),
  body('currentPassword').optional().notEmpty().withMessage('رمز عبور فعلی الزامی است'),
  validate,
], updateProfile);

router.post('/verify-phone', protect, [
  body('code').notEmpty().withMessage('کد تأیید را وارد کنید').matches(/^\d{6}$/).withMessage('کد تأیید باید ۶ رقم باشد'),
  validate,
], verifyPhone);

router.post('/forgot-password', forgotLimiter, [
  body('email').isEmail().withMessage('ایمیل معتبر نیست').custom((email) => {
    if (!validateEmailDomain(email)) {
      throw new Error('ایمیل معتبر نیست');
    }
    return true;
  }),
  validate,
], forgotPassword);

router.post('/reset-password/:token', resetLimiter, [
  body('password')
    .isLength({ min: 8 }).withMessage('رمز عبور باید حداقل ۸ کاراکتر باشد')
    .matches(/[a-zA-Z]/).withMessage('رمز عبور باید حداقل یک حرف انگلیسی داشته باشد')
    .matches(/\d/).withMessage('رمز عبور باید حداقل یک عدد داشته باشد'),
], resetPassword);

module.exports = router;
