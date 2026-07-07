const router = require('express').Router();
const { body, query, validationResult } = require('express-validator');
const { requestPayment, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

router.post('/zarinpal/request', protect, [
  body('orderId').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], requestPayment);

router.get('/zarinpal/callback', [
  query('orderId').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], verifyPayment);

module.exports = router;
