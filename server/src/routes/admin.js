const router = require('express').Router();
const { body, param } = require('express-validator');
const path = require('path');
const multer = require('multer');
const { protect, admin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const validate = require('../middlewares/validate');
const {
  getStats,
  getAdminOrders,
  updateOrderStatus,
  deleteOrder,
  getAdminUsers,
  getAdminReviews,
  approveReview,
  rejectReview,
  deleteAdminReview,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  createCar,
  updateCar,
  deleteCar,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  updateUser,
  deleteUser,
  getLowStockProducts,
  exportProductsCsv,
  exportOrdersCsv,
  getSellers,
  createSeller,
  updateSeller,
  deleteSeller,
  getSellerOrders,
  updateSellerOrderStatus,
  deleteSellerOrder,
  getMasterPrices,
  updateMasterPrice,
  uploadMasterPriceXlsx,
} = require('../controllers/adminController');

const xlsxUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.resolve(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.xlsx`),
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.xlsx', '.xls'].includes(ext)) return cb(new Error('فقط فرمت xlsx و xls مجاز است'), false);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(protect, admin);

router.get('/stats', getStats);
router.get('/orders', getAdminOrders);
router.get('/products', getAdminProducts);

router.put('/orders/:id', [
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  body('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('وضعیت نامعتبر است'),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('وضعیت پرداخت نامعتبر است'),
  body('transactionId').optional().isString().trim().withMessage('شناسه تراکنش نامعتبر است'),
  validate,
], updateOrderStatus);

router.delete('/orders/:id', [
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], deleteOrder);

router.get('/users', getAdminUsers);
router.put('/users/:id', [
  param('id').isMongoId().withMessage('شناسه کاربر نامعتبر است'),
  body('role').optional().isIn(['user', 'admin', 'seller']).withMessage('نقش نامعتبر است'),
  body('isActive').optional().isBoolean().withMessage('مقدار فعال/غیرفعال نامعتبر است'),
  validate,
], updateUser);
router.delete('/users/:id', [
  param('id').isMongoId().withMessage('شناسه کاربر نامعتبر است'),
  validate,
], deleteUser);

router.get('/reviews', getAdminReviews);
router.put('/reviews/:id/approve', [
  param('id').isMongoId().withMessage('شناسه نظر نامعتبر است'),
  validate,
], approveReview);

router.put('/reviews/:id/reject', [
  param('id').isMongoId().withMessage('شناسه نظر نامعتبر است'),
  validate,
], rejectReview);

router.delete('/reviews/:id', [
  param('id').isMongoId().withMessage('شناسه نظر نامعتبر است'),
  validate,
], deleteAdminReview);

router.post('/products', upload('images', 10), [
  body('name').notEmpty().withMessage('نام محصول الزامی است'),
  body('slug').notEmpty().withMessage('slug الزامی است'),
  body('price').isNumeric({ min: 0 }).withMessage('قیمت باید عدد معتبر باشد'),
  body('stock').isInt({ min: 0 }).withMessage('موجودی باید عدد صحیح معتبر باشد'),
  body('category').isMongoId().withMessage('دسته‌بندی نامعتبر است'),
  validate,
], createProduct);

router.post('/products/:id/duplicate', [
  param('id').isMongoId().withMessage('شناسه محصول نامعتبر است'),
  validate,
], duplicateProduct);

router.put('/products/:id', upload('images', 10), [
  param('id').isMongoId().withMessage('شناسه محصول نامعتبر است'),
  body('name').optional().notEmpty().withMessage('نام محصول نمی‌تواند خالی باشد'),
  body('price').optional().isNumeric({ min: 0 }).withMessage('قیمت باید عدد معتبر باشد'),
  body('stock').optional().isInt({ min: 0 }).withMessage('موجودی باید عدد صحیح معتبر باشد'),
  validate,
], updateProduct);

router.delete('/products/:id', [
  param('id').isMongoId().withMessage('شناسه محصول نامعتبر است'),
  validate,
], deleteProduct);

router.post('/categories', [
  body('name').notEmpty().withMessage('نام دسته‌بندی الزامی است'),
  body('slug').notEmpty().withMessage('slug الزامی است'),
  validate,
], createCategory);

router.put('/categories/:id', [
  param('id').isMongoId().withMessage('شناسه دسته‌بندی نامعتبر است'),
  body('name').optional().notEmpty().withMessage('نام دسته‌بندی نمی‌تواند خالی باشد'),
  body('slug').optional().notEmpty().withMessage('slug نمی‌تواند خالی باشد'),
  validate,
], updateCategory);

router.delete('/categories/:id', [
  param('id').isMongoId().withMessage('شناسه دسته‌بندی نامعتبر است'),
  validate,
], deleteCategory);

router.post('/cars', [
  upload('image'),
  body('brand').notEmpty().withMessage('برند خودرو الزامی است'),
  body('model').notEmpty().withMessage('مدل خودرو الزامی است'),
  body('year').optional().isNumeric().withMessage('سال باید عدد باشد'),
  validate,
], createCar);

router.put('/cars/:id', [
  upload('image'),
  param('id').isMongoId().withMessage('شناسه خودرو نامعتبر است'),
  body('brand').optional().notEmpty().withMessage('برند نمی‌تواند خالی باشد'),
  body('model').optional().notEmpty().withMessage('مدل نمی‌تواند خالی باشد'),
  validate,
], updateCar);

router.delete('/cars/:id', [
  param('id').isMongoId().withMessage('شناسه خودرو نامعتبر است'),
  validate,
], deleteCar);

router.get('/coupons', getCoupons);

router.post('/coupons', [
  body('code').notEmpty().withMessage('کد تخفیف الزامی است'),
  body('type').isIn(['percent', 'fixed']).withMessage('نوع تخفیف باید درصد یا مبلغ ثابت باشد'),
  body('value').isNumeric({ min: 0 }).withMessage('مقدار تخفیف باید عدد معتبر باشد'),
  validate,
], createCoupon);

router.put('/coupons/:id', [
  param('id').isMongoId().withMessage('شناسه کد تخفیف نامعتبر است'),
  body('code').optional().notEmpty().withMessage('کد تخفیف نمی‌تواند خالی باشد'),
  body('type').optional().isIn(['percent', 'fixed']).withMessage('نوع تخفیف باید درصد یا مبلغ ثابت باشد'),
  body('value').optional().isNumeric({ min: 0 }).withMessage('مقدار تخفیف باید عدد معتبر باشد'),
  validate,
], updateCoupon);

router.delete('/coupons/:id', [
  param('id').isMongoId().withMessage('شناسه کد تخفیف نامعتبر است'),
  validate,
], deleteCoupon);

router.get('/products/low-stock', getLowStockProducts);
router.get('/products/export/csv', exportProductsCsv);
router.get('/orders/export/csv', exportOrdersCsv);

/* ─── Seller Management ─── */

router.get('/sellers', getSellers);

router.post('/sellers', [
  body('name').notEmpty().withMessage('نام الزامی است'),
  body('username').notEmpty().withMessage('نام کاربری الزامی است'),
  body('password').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  body('markupPercent').optional().isNumeric({ min: 0 }).withMessage('درصد افزایش باید عدد مثبت باشد'),
  validate,
], createSeller);

router.put('/sellers/:id', [
  param('id').isMongoId().withMessage('شناسه فروشنده نامعتبر است'),
  body('markupPercent').optional().isNumeric({ min: 0 }).withMessage('درصد افزایش باید عدد مثبت باشد'),
  validate,
], updateSeller);

router.delete('/sellers/:id', [
  param('id').isMongoId().withMessage('شناسه فروشنده نامعتبر است'),
  validate,
], deleteSeller);

/* ─── Master Prices ─── */

router.get('/master-prices', getMasterPrices);

router.put('/master-prices/:id', [
  param('id').isMongoId().withMessage('شناسه محصول نامعتبر است'),
  body('masterPrice').isNumeric({ min: 0 }).withMessage('قیمت پایه باید عدد معتبر باشد'),
  validate,
], updateMasterPrice);

router.post('/master-prices/upload', xlsxUpload.single('file'), uploadMasterPriceXlsx);

/* ─── Seller Orders ─── */

router.get('/seller-orders', getSellerOrders);

router.put('/seller-orders/:id/status', [
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  body('sellerStatus').isIn(['in_progress', 'calling', 'called', 'accept', 'sent', 'cancelled']).withMessage('وضعیت نامعتبر است'),
  validate,
], updateSellerOrderStatus);

router.delete('/seller-orders/:id', [
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], deleteSellerOrder);

module.exports = router;
