const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { validateCoupon } = require('../controllers/couponController');
const { protect } = require('../middlewares/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

router.post('/validate', protect, [
  body('code').notEmpty().withMessage('کد تخفیف الزامی است'),
  body('totalAmount').isNumeric().withMessage('مبلغ باید عدد باشد'),
  validate,
], validateCoupon);

module.exports = router;
