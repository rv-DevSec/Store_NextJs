const router = require('express').Router();
const { param } = require('express-validator');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { downloadInvoice } = require('../controllers/invoiceController');

router.get('/:id', protect, [
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است'),
  validate,
], downloadInvoice);

module.exports = router;
