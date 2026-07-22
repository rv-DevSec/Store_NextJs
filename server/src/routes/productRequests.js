const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect, admin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createRequest,
  getRequests,
  updateRequest,
  deleteRequest,
} = require('../controllers/productRequestController');

router.post('/', [
  body('name').notEmpty().withMessage('نام الزامی است'),
  body('phone').notEmpty().withMessage('شماره تماس الزامی است'),
  body('productName').notEmpty().withMessage('نام محصول الزامی است'),
  validate,
], createRequest);

router.get('/', protect, admin, getRequests);
router.put('/:id', protect, admin, [
  param('id').isMongoId().withMessage('شناسه نامعتبر است'),
  validate,
], updateRequest);
router.delete('/:id', protect, admin, [
  param('id').isMongoId().withMessage('شناسه نامعتبر است'),
  validate,
], deleteRequest);

module.exports = router;
