const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect } = require('../middlewares/auth');
const { getAddresses, createAddress, updateAddress, deleteAddress } = require('../controllers/addressController');

const validate = require('../middlewares/validate');

router.get('/', protect, getAddresses);
router.post('/', protect, [
  body('title').notEmpty().withMessage('عنوان آدرس الزامی است'),
  body('province').notEmpty().withMessage('استان الزامی است'),
  body('city').notEmpty().withMessage('شهر الزامی است'),
  body('fullAddress').notEmpty().withMessage('آدرس کامل الزامی است'),
  body('postalCode').notEmpty().withMessage('کد پستی الزامی است'),
  body('phone').notEmpty().withMessage('شماره تماس الزامی است'),
  validate,
], createAddress);
router.put('/:id', protect, [
  param('id').isMongoId().withMessage('شناسه آدرس نامعتبر است'),
  body('title').optional().notEmpty().withMessage('عنوان آدرس نمی‌تواند خالی باشد'),
  body('province').optional().notEmpty().withMessage('استان نمی‌تواند خالی باشد'),
  body('city').optional().notEmpty().withMessage('شهر نمی‌تواند خالی باشد'),
  body('fullAddress').optional().notEmpty().withMessage('آدرس کامل نمی‌تواند خالی باشد'),
  body('postalCode').optional().notEmpty().withMessage('کد پستی نمی‌تواند خالی باشد'),
  body('phone').optional().notEmpty().withMessage('شماره تماس نمی‌تواند خالی باشد'),
  validate,
], updateAddress);
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('شناسه آدرس نامعتبر است'),
  validate,
], deleteAddress);

module.exports = router;
