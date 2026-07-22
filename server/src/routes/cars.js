const router = require('express').Router();
const { query } = require('express-validator');
const { getCars } = require('../controllers/carController');
const validate = require('../middlewares/validate');

router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
], getCars);

module.exports = router;
