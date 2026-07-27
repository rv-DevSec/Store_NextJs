const router = require('express').Router();
const { body, param } = require('express-validator');
const { createOrder, getUserOrders, getOrderById, updateOrderPaymentInfo } = require('../controllers/orderController');
const upload = require('../middlewares/upload');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post(
  '/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('سبد خرید خالی است'),
    body('items.*.productId').isMongoId().withMessage('شناسه محصول نامعتبر است'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('تعداد باید حداقل ۱ باشد'),
    body('shippingAddress.fullName').notEmpty().withMessage('نام و نام خانوادگی الزامی است'),
    body('shippingAddress.phone').notEmpty().withMessage('شماره تماس الزامی است'),
    body('shippingAddress.province').notEmpty().withMessage('استان الزامی است'),
    body('shippingAddress.city').notEmpty().withMessage('شهر الزامی است'),
    body('shippingAddress.fullAddress').notEmpty().withMessage('آدرس کامل الزامی است'),
    body('shippingAddress.postalCode').notEmpty().withMessage('کد پستی الزامی است'),
    body('paymentMethod').optional().isIn(['zarinpal', 'cod', 'card-to-card']).withMessage('روش پرداخت نامعتبر است'),
    validate,
  ],
  createOrder
);

router.get('/', protect, getUserOrders);
router.get('/:id', protect, [
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], getOrderById);
router.put('/:id/payment-info', protect, [
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], upload('receipt'), [
  body('transactionId').optional().isString().trim().withMessage('شناسه تراکنش نامعتبر است'),
  validate,
], updateOrderPaymentInfo);

module.exports = router;
