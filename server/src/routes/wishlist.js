const router = require('express').Router();
const { param } = require('express-validator');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { getFavorites, toggleFavorite } = require('../controllers/wishlistController');

router.get('/', protect, getFavorites);
router.post('/:productId', protect, [
  param('productId').isMongoId().withMessage('شناسه محصول نامعتبر است'),
  validate,
], toggleFavorite);

module.exports = router;
