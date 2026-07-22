const router = require('express').Router();
const { body } = require('express-validator');
const { validateCoupon } = require('../controllers/couponController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post('/validate', protect, [
  body('code').notEmpty().withMessage('کد تخفیف الزامی است'),
  body('totalAmount').isNumeric().withMessage('مبلغ باید عدد باشد'),
  validate,
], validateCoupon);

module.exports = router;
