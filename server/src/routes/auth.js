const router = require('express').Router();
const { body } = require('express-validator');
const { register, registerSeller, login, getMe, forgotPassword, resetPassword, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { loginLimiter, registerLimiter, forgotLimiter, resetLimiter, refreshLimiter } = require('../middlewares/rateLimiter');

router.post(
  '/register',
  registerLimiter,
  [
    body('name').notEmpty().withMessage('نام الزامی است'),
    body('email').isEmail().withMessage('ایمیل معتبر نیست'),
    body('password')
      .isLength({ min: 8 }).withMessage('رمز عبور باید حداقل ۸ کاراکتر باشد')
      .matches(/[a-zA-Z]/).withMessage('رمز عبور باید حداقل یک حرف انگلیسی داشته باشد')
      .matches(/\d/).withMessage('رمز عبور باید حداقل یک عدد داشته باشد'),
  ],
  register
);

router.post(
  '/register/seller',
  registerLimiter,
  [
    body('name').notEmpty().withMessage('نام الزامی است'),
    body('username').notEmpty().withMessage('نام کاربری الزامی است'),
    body('password').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  ],
  registerSeller
);

router.post(
  '/login',
  loginLimiter,
  [
    body('password').notEmpty().withMessage('رمز عبور الزامی است'),
  ],
  login
);

router.post('/refresh-token', refreshLimiter, refreshToken);
router.post('/logout', protect, logout);

router.get('/me', protect, getMe);

router.post('/forgot-password', forgotLimiter, [
  body('email').isEmail().withMessage('ایمیل معتبر نیست'),
], forgotPassword);

router.post('/reset-password/:token', resetLimiter, [
  body('password')
    .isLength({ min: 8 }).withMessage('رمز عبور باید حداقل ۸ کاراکتر باشد')
    .matches(/[a-zA-Z]/).withMessage('رمز عبور باید حداقل یک حرف انگلیسی داشته باشد')
    .matches(/\d/).withMessage('رمز عبور باید حداقل یک عدد داشته باشد'),
], resetPassword);

module.exports = router;
