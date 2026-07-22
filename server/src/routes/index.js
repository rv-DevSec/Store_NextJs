const router = require('express').Router();

router.get('/health', (req, res) => {
  res.json({ success: true });
});

router.use('/auth', require('./auth'));
router.use('/products', require('./products'));
router.use('/categories', require('./categories'));
router.use('/cars', require('./cars'));
router.use('/orders', require('./orders'));
router.use('/coupons', require('./coupons'));
router.use('/reviews', require('./reviews'));
router.use('/payment', require('./payment'));
router.use('/upload', require('./upload'));
router.use('/settings', require('./settings'));
router.use('/wishlist', require('./wishlist'));
router.use('/addresses', require('./address'));
router.use('/invoice', require('./invoice'));
router.use('/admin', require('./admin'));
router.use('/seller', require('./seller'));
router.use('/product-requests', require('./productRequests'));

module.exports = router;
