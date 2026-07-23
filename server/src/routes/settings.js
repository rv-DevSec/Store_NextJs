const router = require('express').Router();
const { body } = require('express-validator');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, admin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/', getSettings);
router.put('/', protect, admin, [
  body('phones').optional().isArray(),
  body('phones.*.name').optional().isString().trim(),
  body('phones.*.tel').optional().isString().trim(),
  body('email').optional().isString().trim(),
  body('address').optional().isString().trim(),
  body('about').optional().isString().trim(),
  body('headerImage').optional().isString().trim(),
  body('shippingPrice').optional().isNumeric(),
  body('zarinpalMerchantId').optional().isString().trim(),
  body('zarinpal').optional().isObject(),
  body('zarinpal.enabled').optional().isBoolean(),
  body('cardToCard').optional().isObject(),
  body('cardToCard.active').optional().isBoolean(),
  body('cardToCard.bankName').optional().isString().trim(),
  body('cardToCard.cardNumber').optional().isString().trim(),
  body('cardToCard.accountHolder').optional().isString().trim(),
  body('festival').optional().isObject(),
  body('festival.active').optional().isBoolean(),
  body('festival.topBanner').optional().isBoolean(),
  body('festival.topBannerText').optional().isString().trim(),
  body('festival.title').optional().isString().trim(),
  body('festival.subtitle').optional().isString().trim(),
  body('festival.btnText').optional().isString().trim(),
  body('festival.bgColor').optional().isString().trim(),
  body('hidePrices').optional().isBoolean(),
  validate,
], updateSettings);

module.exports = router;
