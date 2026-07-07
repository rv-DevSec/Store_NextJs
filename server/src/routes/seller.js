const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  getSellerProducts,
  createSellerOrder,
  getSellerOrders,
  getSellerOrderById,
} = require('../controllers/sellerController');

const sellerGuard = (req, res, next) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
  }
  next();
};

router.use(protect, sellerGuard);

router.get('/products', getSellerProducts);

router.post('/orders', [
  body('items').isArray({ min: 1 }).withMessage('لیست سفارش خالی است'),
  body('items.*.productId').isMongoId().withMessage('شناسه محصول نامعتبر است'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('تعداد باید حداقل ۱ باشد'),
  validate,
], createSellerOrder);

router.get('/orders', getSellerOrders);

router.get('/orders/:id', [
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], getSellerOrderById);

module.exports = router;
