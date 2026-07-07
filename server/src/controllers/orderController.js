const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const SiteSettings = require('../models/SiteSettings');
const config = require('../config');
const { AppError } = require('../middlewares/errorHandler');

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, couponCode, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return next(new AppError('سبد خرید خالی است', 400));
    }

    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.province || !shippingAddress?.city || !shippingAddress?.fullAddress || !shippingAddress?.postalCode) {
      return next(new AppError('لطفاً تمام اطلاعات آدرس را وارد کنید', 400));
    }

    let totalAmount = 0;
    const orderItems = [];
    const productIds = items.map(i => i.productId);

    // Validate & price all items
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) {
        return next(new AppError(`محصول یافت نشد: ${item.productId}`, 404));
      }
      if (!product.isActive) {
        return next(new AppError(`محصول ${product.name} غیرفعال است`, 400));
      }
      if (product.stock < item.qty) {
        return next(new AppError(`موجودی ${product.name} کافی نیست`, 400));
      }

      const price = product.discountPrice || product.price;
      totalAmount += price * item.qty;

      orderItems.push({
        product: product._id,
        name: product.name,
        price,
        qty: item.qty,
        image: product.images?.[0] || '',
      });
    }

    // Phase 2: write phase with rollback on any failure
    const decrementedItems = [];
    let appliedCoupon = null;
    let couponUpdated = false;

    try {
      for (const item of items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { new: true }
        );
        if (!updated) {
          throw new AppError(`موجودی ${item.productId} کافی نیست`, 400);
        }
        decrementedItems.push({ productId: item.productId, qty: item.qty });
      }

      let discountAmount = 0;

      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          isActive: true,
          expiresAt: { $gt: new Date() },
        });

        if (!coupon) {
          throw new AppError('کد تخفیف نامعتبر است', 400);
        }

        if (totalAmount < coupon.minPurchase) {
          throw new AppError(`حداقل مبلغ خرید برای این کد تخفیف ${coupon.minPurchase.toLocaleString()} تومان است`, 400);
        }

        if (coupon.type === 'percent') {
          discountAmount = Math.round((totalAmount * coupon.value) / 100);
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.value;
        }

        if (coupon.usageLimit != null) {
          const updatedCoupon = await Coupon.findOneAndUpdate(
            { _id: coupon._id, $expr: { $lt: ['$usedCount', '$usageLimit'] } },
            { $inc: { usedCount: 1 } },
            { new: true }
          );
          if (!updatedCoupon) {
            throw new AppError('کد تخفیف منقضی شده است', 400);
          }
        } else {
          await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
        }
        appliedCoupon = coupon._id;
        couponUpdated = true;
      }

      const finalAmount = Math.max(0, totalAmount - discountAmount);

      const validMethods = ['zarinpal', 'cod', 'card-to-card'];
      if (!validMethods.includes(paymentMethod)) {
        throw new AppError('روش پرداخت نامعتبر است', 400);
      }
      if (paymentMethod === 'zarinpal') {
        const settings = await SiteSettings.findOne();
        if (!config.zarinpalMerchantId || !settings?.zarinpal?.enabled) {
          throw new AppError('پرداخت آنلاین (زرین‌پال) فعلاً غیرفعال است', 400);
        }
      }
      const method = paymentMethod;

      const orderData = {
        user: req.user._id,
        items: orderItems,
        totalAmount: finalAmount,
        discountAmount,
        coupon: appliedCoupon,
        shippingCost: 0,
        shippingAddress,
        paymentMethod: method,
        status: 'pending',
        paymentStatus: method === 'cod' || method === 'card-to-card' ? 'pending' : 'pending',
      };

      if (method === 'card-to-card' && req.body.transactionId) {
        orderData.paymentInfo = { transactionId: req.body.transactionId };
      }

      const order = await Order.create(orderData);
      const needsPayment = method === 'zarinpal';

      res.status(201).json({
        success: true,
        order,
        needsPayment,
      });
    } catch (err) {
      // Rollback stock
      if (decrementedItems.length) {
        await Promise.all(decrementedItems.map(i =>
          Product.findByIdAndUpdate(i.productId, { $inc: { stock: i.qty } })
        ));
      }
      // Rollback coupon
      if (couponUpdated && appliedCoupon) {
        await Coupon.findByIdAndUpdate(appliedCoupon, { $inc: { usedCount: -1 } });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderPaymentInfo = async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    const receiptImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    const update = {};
    if (transactionId) update['paymentInfo.transactionId'] = transactionId;
    if (receiptImage) update['paymentInfo.receiptImage'] = receiptImage;

    if (Object.keys(update).length === 0) {
      return next(new AppError('لطفاً شناسه تراکنش یا تصویر رسید را وارد کنید', 400));
    }

    const updated = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        paymentMethod: 'card-to-card',
        paymentStatus: 'pending',
      },
      update,
      { new: true }
    );

    if (!updated) {
      return next(new AppError('سفارش یافت نشد یا امکان ویرایش اطلاعات پرداخت وجود ندارد', 404));
    }

    res.json({ success: true, order: updated });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name slug images')
      .lean();

    if (!order) {
      return next(new AppError('سفارش یافت نشد', 404));
    }

    if (!order.user) {
      return next(new AppError('دسترسی غیرمجاز', 403));
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('دسترسی غیرمجاز', 403));
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
