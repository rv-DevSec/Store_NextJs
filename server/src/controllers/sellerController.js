const Order = require('../models/Order');
const Product = require('../models/Product');
const { AppError } = require('../middlewares/errorHandler');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const calcSellerPrice = (masterPrice, markupPercent) => {
  const raw = masterPrice * (1 + markupPercent / 100);
  return Math.round(raw / 1000) * 1000;
};

exports.getSellerProducts = async (req, res, next) => {
  try {
    const markupPercent = req.user.markupPercent || 0;
    const { search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: 'i' };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const result = products.map(p => {
      const basePrice = p.masterPrice || p.price;
      return {
        ...p,
        sellerPrice: calcSellerPrice(basePrice, markupPercent),
      };
    });

    res.json({
      success: true,
      products: result,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createSellerOrder = async (req, res, next) => {
  try {
    const { items, note } = req.body;
    const markupPercent = req.user.markupPercent || 0;

    if (!items || items.length === 0) {
      return next(new AppError('لیست سفارش خالی است', 400));
    }

    let totalAmount = 0;
    const orderItems = [];
    const productIds = items.map(i => i.productId);

    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) {
        return next(new AppError(`محصول یافت نشد: ${item.productId}`, 404));
      }
      if (product.stock < item.qty) {
        return next(new AppError(`موجودی ${product.name} کافی نیست`, 400));
      }
      const basePrice = product.masterPrice || product.price;
      const price = calcSellerPrice(basePrice, markupPercent);
      totalAmount += price * item.qty;
      orderItems.push({
        product: product._id,
        name: product.name,
        price,
        qty: item.qty,
        image: product.images?.[0] || '',
      });
    }

    const decrementedItems = [];
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

      const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        totalAmount,
        seller: req.user._id,
        type: 'seller',
        sellerStatus: 'in_progress',
        sellerNote: note || '',
        paymentMethod: 'seller',
        shippingAddress: {},
        status: 'pending',
        paymentStatus: 'pending',
      });

      res.status(201).json({ success: true, order });
    } catch (err) {
      if (decrementedItems.length) {
        await Promise.all(decrementedItems.map(i =>
          Product.findByIdAndUpdate(i.productId, { $inc: { stock: i.qty } })
        ));
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

exports.getSellerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id, type: 'seller' };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSellerOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
      type: 'seller',
    }).populate('items.product', 'name slug images').lean();

    if (!order) {
      return next(new AppError('سفارش یافت نشد', 404));
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
