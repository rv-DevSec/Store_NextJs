const router = require('express').Router();
const { body, query } = require('express-validator');
const { requestPayment, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post('/zarinpal/request', protect, [
  body('orderId').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], requestPayment);

router.get('/zarinpal/callback', [
  query('orderId').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], verifyPayment);

module.exports = router;
