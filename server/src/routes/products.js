const router = require('express').Router();
const { query, param } = require('express-validator');
const { getProducts, getProductBySlug, getRelatedProducts } = require('../controllers/productController');
const validate = require('../middlewares/validate');

router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('category').optional().isMongoId(),
  query('search').optional().isString().trim().isLength({ max: 200 }),
  query('brand').optional().isString().trim().isLength({ max: 100 }),
  query('car').optional().isMongoId(),
  query('minPrice').optional().isNumeric({ min: 0 }),
  query('maxPrice').optional().isNumeric({ min: 0 }),
  query('featured').optional().isIn(['true', 'false']),
  query('sort').optional().isString().trim().isLength({ max: 20 }),
  validate,
], getProducts);
router.get('/:slug', [
  param('slug').isString().trim().isLength({ max: 200 }),
  validate,
], getProductBySlug);
router.get('/:slug/related', [
  param('slug').isString().trim().isLength({ max: 200 }),
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  validate,
], getRelatedProducts);

module.exports = router;
