const router = require('express').Router();
const { query, param } = require('express-validator');
const { getProducts, getProductBySlug } = require('../controllers/productController');
const validate = require('../middlewares/validate');

router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('category').optional().isMongoId(),
  query('search').optional().isString().trim(),
  query('sort').optional().isString().trim(),
  validate,
], getProducts);
router.get('/:slug', [
  param('slug').isString().trim(),
  validate,
], getProductBySlug);

module.exports = router;
