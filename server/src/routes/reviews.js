const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
} = require('../controllers/reviewController');

// Public: get approved reviews for a product
router.get('/product/:productId', [
  param('productId').isMongoId().withMessage('شناسه محصول نامعتبر است'),
  validate,
], getProductReviews);

// Protected: get current user's reviews
router.get('/me', protect, getUserReviews);

// Protected: create a review
router.post('/', protect, [
  body('product').isMongoId().withMessage('شناسه محصول نامعتبر است'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('امتیاز باید بین ۱ تا ۵ باشد'),
  body('comment').notEmpty().withMessage('متن نظر الزامی است').isLength({ max: 1000 }).withMessage('متن نظر حداکثر ۱۰۰۰ کاراکتر'),
  validate,
], createReview);

// Protected: update own review
router.put('/:id', protect, [
  param('id').isMongoId().withMessage('شناسه نظر نامعتبر است'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('امتیاز باید بین ۱ تا ۵ باشد'),
  body('comment').optional().notEmpty().withMessage('متن نظر نمی‌تواند خالی باشد').isLength({ max: 1000 }).withMessage('متن نظر حداکثر ۱۰۰۰ کاراکتر'),
  validate,
], updateReview);

// Protected: delete own review (admin can delete any)
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('شناسه نظر نامعتبر است'),
  validate,
], deleteReview);

module.exports = router;
