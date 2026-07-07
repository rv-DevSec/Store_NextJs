const Coupon = require('../models/Coupon');
const { AppError } = require('../middlewares/errorHandler');

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, totalAmount } = req.body;

    if (!code) {
      return next(new AppError('کد تخفیف را وارد کنید', 400));
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!coupon || (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)) {
      return next(new AppError('کد تخفیف نامعتبر است', 400));
    }

    if (totalAmount < coupon.minPurchase) {
      return next(new AppError('کد تخفیف برای این مبلغ قابل استفاده نیست', 400));
    }

    let discountAmount = 0;
    if (coupon.type === 'percent') {
      discountAmount = Math.round((totalAmount * coupon.value) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};
