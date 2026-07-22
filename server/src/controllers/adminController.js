const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Car = require('../models/Car');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { AppError } = require('../middlewares/errorHandler');
const { Parser } = require('json2csv');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PRODUCT_ALLOWED = ['name', 'slug', 'description', 'price', 'discountPrice', 'masterPrice', 'stock', 'brand', 'images', 'specs', 'compatibleCars', 'category', 'featured', 'isActive'];
const pickProduct = (body) => { const o = {}; for (const k of PRODUCT_ALLOWED) if (body[k] !== undefined) o[k] = body[k]; return o; };

const CATEGORY_ALLOWED = ['name', 'slug', 'description', 'icon', 'order'];
const pickCategory = (body) => { const o = {}; for (const k of CATEGORY_ALLOWED) if (body[k] !== undefined) o[k] = body[k]; return o; };

const CAR_ALLOWED = ['brand', 'model', 'year', 'image'];
const pickCar = (body) => { const o = {}; for (const k of CAR_ALLOWED) if (body[k] !== undefined) o[k] = body[k]; return o; };

const COUPON_ALLOWED = ['code', 'type', 'value', 'minPurchase', 'maxDiscount', 'usageLimit', 'expiresAt', 'isActive'];
const pickCoupon = (body) => { const o = {}; for (const k of COUPON_ALLOWED) if (body[k] !== undefined) o[k] = body[k]; return o; };

exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalOrders, totalProducts, totalUsers, totalRevenue, todayOrders, pendingOrders, totalSellers] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      User.countDocuments({ role: 'seller' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalSales: totalRevenue[0]?.total || 0,
        todayOrders,
        pendingOrders,
        totalSellers,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAdminOrders = async (req, res, next) => {
  try {
    const { status, search, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;

    if (status) filter.status = status;

    if (search && search.length < 200) {
      const safe = escapeRegex(search);
      const isObjectId = /^[a-f0-9]{24}$/i.test(search);
      filter.$or = [
        { 'shippingAddress.fullName': { $regex: safe, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: safe, $options: 'i' } },
        { trackingCode: { $regex: safe, $options: 'i' } },
        { orderId: { $regex: safe, $options: 'i' } },
        ...(isObjectId ? [{ _id: search }] : []),
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name phone email')
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

const VALID_PAYMENT_TRANSITIONS = {
  pending: ['paid', 'failed', 'cancelled'],
  paid: ['refunded'],
  failed: ['pending', 'paid'],
  refunded: [],
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingCode, paymentStatus, transactionId } = req.body;

    const existing = await Order.findById(req.params.id).lean();
    if (!existing) {
      return next(new AppError('سفارش یافت نشد', 404));
    }

    if (status && status !== existing.status) {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return next(new AppError('وضعیت نامعتبر است', 400));
      }
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return next(new AppError('وضعیت پرداخت نامعتبر است', 400));
      }
      if (!VALID_PAYMENT_TRANSITIONS[existing.paymentStatus]?.includes(paymentStatus)) {
        return next(new AppError(`تغییر وضعیت پرداخت از ${existing.paymentStatus} به ${paymentStatus} مجاز نیست`, 400));
      }
    }

    const filter = {
      _id: req.params.id,
    };
    if (status) filter.status = existing.status;
    if (paymentStatus) filter.paymentStatus = existing.paymentStatus;
    if (status && paymentStatus) {
      filter.status = existing.status;
      filter.paymentStatus = existing.paymentStatus;
    }

    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (transactionId) update['paymentInfo.transactionId'] = transactionId;

    if (paymentStatus === 'paid' && existing.paymentStatus !== 'paid' && !existing.orderId) {
      const gen = () => Math.random().toString(36).substring(2, 8).toUpperCase();
      update.orderId = `ORD-${gen()}`;
    }

    if (existing.trackingCode) {
      // never change an existing tracking code
    } else if (trackingCode) {
      update.trackingCode = trackingCode;
    } else if (status === 'processing') {
      const gen = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      update.trackingCode = `${gen()}-${gen()}`;
    }

    const order = await Order.findOneAndUpdate(filter, update, { new: true });

    if (!order) {
      return next(new AppError('وضعیت سفارش تغییر کرده است، لطفاً دوباره تلاش کنید', 409));
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new AppError('سفارش یافت نشد', 404));
    }
    const noRestoreStatuses = ['paid', 'delivered', 'shipped', 'refunded'];
    if (!noRestoreStatuses.includes(order.paymentStatus)) {
      await Promise.all(order.items.map(item =>
        Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: 0 } },
          { $inc: { stock: item.qty } }
        )
      ));
    }
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'سفارش حذف شد' });
  } catch (err) {
    next(err);
  }
};

exports.getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password -refreshTokens -resetPasswordToken -resetPasswordExpire').sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

exports.getAdminReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({})
      .populate('user', 'name')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const update = stats.length > 0
    ? { rating: Math.round(stats[0].avgRating * 10) / 10, numReviews: stats[0].count }
    : { rating: 0, numReviews: 0 };

  await Product.findByIdAndUpdate(productId, update);
};

exports.approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', isApproved: true },
      { new: true }
    );

    if (!review) {
      return next(new AppError('نظر یافت نشد', 404));
    }

    await updateProductRating(review.product);

    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

exports.rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', isApproved: false },
      { new: true }
    );

    if (!review) {
      return next(new AppError('نظر یافت نشد', 404));
    }

    await updateProductRating(review.product);

    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

exports.deleteAdminReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new AppError('نظر یافت نشد', 404));
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);
    await updateProductRating(productId);

    res.json({ success: true, message: 'نظر حذف شد' });
  } catch (err) {
    next(err);
  }
};

/* ─── Admin Product List (with favorites count) ─── */

exports.getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'favorites',
          as: 'favoritedBy',
        },
      },
      {
        $addFields: {
          favoritesCount: { $size: '$favoritedBy' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
    ]);

    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
};

/* ─── Product CRUD ─── */

exports.createProduct = async (req, res, next) => {
  try {
    const data = pickProduct(req.body);
    if (req.files && req.files.length > 0) {
      data.images = req.files.map((f) => `/uploads/${f.filename}`);
    }
    if (data.price) data.price = Number(data.price);
    if (data.discountPrice) data.discountPrice = Number(data.discountPrice);
    if (data.stock) data.stock = Number(data.stock);
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const data = pickProduct(req.body);
    if (req.files && req.files.length > 0) {
      data.images = req.files.map((f) => `/uploads/${f.filename}`);
    }
    if (data.price) data.price = Number(data.price);
    if (data.discountPrice) data.discountPrice = Number(data.discountPrice);
    if (data.stock) data.stock = Number(data.stock);
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return next(new AppError('محصول یافت نشد', 404));
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(new AppError('محصول یافت نشد', 404));
    res.json({ success: true, message: 'محصول حذف شد' });
  } catch (err) {
    next(err);
  }
};

exports.duplicateProduct = async (req, res, next) => {
  try {
    const original = await Product.findById(req.params.id).lean();
    if (!original) return next(new AppError('محصول یافت نشد', 404));

    const baseSlug = original.slug.replace(/-\d+$/, '');
    let newSlug = `${baseSlug}-${Date.now()}`;
    let count = 1;
    while (await Product.findOne({ slug: newSlug })) {
      newSlug = `${baseSlug}-${Date.now()}-${count++}`;
    }

    const { _id, createdAt, updatedAt, __v, ...data } = original;
    data.name = `${original.name} (کپی)`;
    data.slug = newSlug;
    data.isActive = false;

    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

/* ─── Category CRUD ─── */

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(pickCategory(req.body));
    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, pickCategory(req.body), { new: true, runValidators: true });
    if (!category) return next(new AppError('دسته‌بندی یافت نشد', 404));
    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'دسته‌بندی حذف شد' });
  } catch (err) {
    next(err);
  }
};

/* ─── Car CRUD ─── */

exports.createCar = async (req, res, next) => {
  try {
    const data = pickCar(req.body);
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }
    if (!data.slug && data.brand && data.model) {
      data.slug = `${data.brand}-${data.model}`.replace(/\s+/g, '-').toLowerCase();
    }
    const car = await Car.create(data);
    res.status(201).json({ success: true, car });
  } catch (err) {
    next(err);
  }
};

exports.updateCar = async (req, res, next) => {
  try {
    const data = pickCar(req.body);
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }
    if (!data.slug && data.brand && data.model) {
      data.slug = `${data.brand}-${data.model}`.replace(/\s+/g, '-').toLowerCase();
    }
    const car = await Car.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!car) return next(new AppError('خودرو یافت نشد', 404));
    res.json({ success: true, car });
  } catch (err) {
    next(err);
  }
};

exports.deleteCar = async (req, res, next) => {
  try {
    await Car.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'خودرو حذف شد' });
  } catch (err) {
    next(err);
  }
};

/* ─── Coupon CRUD ─── */

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(pickCoupon(req.body));
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    next(err);
  }
};

exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, coupons });
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, pickCoupon(req.body), { new: true, runValidators: true });
    if (!coupon) return next(new AppError('کد تخفیف یافت نشد', 404));
    res.json({ success: true, coupon });
  } catch (err) {
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'کد تخفیف حذف شد' });
  } catch (err) {
    next(err);
  }
};

/* ─── User Management ─── */

exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const update = {};
    if (role) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return next(new AppError('کاربر یافت نشد', 404));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError('کاربر یافت نشد', 404));
    res.json({ success: true, message: 'کاربر حذف شد' });
  } catch (err) {
    next(err);
  }
};

/* ─── Low Stock ─── */

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold, 10) || 5;
    const products = await Product.find({ stock: { $lte: threshold }, isActive: true })
      .populate('category', 'name')
      .sort({ stock: 1 })
      .lean();
    res.json({ success: true, products, count: products.length });
  } catch (err) {
    next(err);
  }
};

/* ─── CSV Export ─── */

exports.exportProductsCsv = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .limit(10000)
      .lean();

    const rows = products.map((p) => ({
      name: p.name,
      slug: p.slug,
      brand: p.brand || '',
      category: p.category?.name || '',
      price: p.price,
      discountPrice: p.discountPrice || '',
      stock: p.stock,
      isActive: p.isActive ? 'فعال' : 'غیرفعال',
      featured: p.featured ? 'بله' : 'خیر',
      createdAt: new Date(p.createdAt).toLocaleDateString('fa-IR'),
    }));

    const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) {
    next(err);
  }
};

/* ─── Seller Management ─── */

exports.getSellers = async (req, res, next) => {
  try {
    const sellers = await User.find({ role: 'seller' })
      .select('name username phone isActive markupPercent createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, sellers });
  } catch (err) {
    next(err);
  }
};

exports.createSeller = async (req, res, next) => {
  try {
    const { name, username, password, phone, markupPercent } = req.body;
    if (!name || !username || !password) {
      return next(new AppError('نام، نام کاربری و رمز عبور الزامی است', 400));
    }
    if (password.length < 6) {
      return next(new AppError('رمز عبور باید حداقل ۶ کاراکتر باشد', 400));
    }

    const existing = await User.findOne({ username }).lean();
    if (existing) {
      return next(new AppError('نام کاربری تکراری است', 400));
    }

    const seller = await User.create({
      name,
      username,
      password,
      phone,
      role: 'seller',
      markupPercent: Math.max(0, markupPercent || 0),
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, seller });
  } catch (err) {
    next(err);
  }
};

exports.updateSeller = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.username) {
      const dup = await User.findOne({ username: req.body.username, _id: { $ne: req.params.id } }).lean();
      if (dup) return next(new AppError('نام کاربری تکراری است', 400));
      updates.username = req.body.username;
    }
    if (req.body.password) {
      if (req.body.password.length < 6) return next(new AppError('رمز عبور باید حداقل ۶ کاراکتر باشد', 400));
      const salt = await require('bcryptjs').genSalt(12);
      updates.password = await require('bcryptjs').hash(req.body.password, salt);
    }
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.markupPercent !== undefined) updates.markupPercent = Math.max(0, req.body.markupPercent);

    const seller = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .select('name username phone isActive markupPercent');
    if (!seller) return next(new AppError('فروشنده یافت نشد', 404));
    res.json({ success: true, seller });
  } catch (err) {
    next(err);
  }
};

exports.deleteSeller = async (req, res, next) => {
  try {
    const seller = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!seller) return next(new AppError('فروشنده یافت نشد', 404));
    res.json({ success: true, message: 'فروشنده غیرفعال شد' });
  } catch (err) {
    next(err);
  }
};

/* ─── Master Prices ─── */

exports.getMasterPrices = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('name images masterPrice price')
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
};

exports.updateMasterPrice = async (req, res, next) => {
  try {
    const { masterPrice } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { masterPrice: Math.max(0, masterPrice) },
      { new: true, runValidators: true }
    ).select('name masterPrice');
    if (!product) return next(new AppError('محصول یافت نشد', 404));
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.uploadMasterPriceXlsx = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('فایل XLSX الزامی است', 400));

    const filePath = req.file.path;
    let workbook;

    try {
      workbook = XLSX.readFile(filePath);
    } catch {
      fs.unlink(filePath, () => {});
      return next(new AppError('فایل نامعتبر است. لطفاً یک فایل XLSX معتبر آپلود کنید', 400));
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      fs.unlink(filePath, () => {});
      return next(new AppError('فایل خالی است', 400));
    }

    const allProducts = await Product.find({ isActive: true }).select('_id name').lean();
    const nameToProduct = Object.fromEntries(allProducts.map(p => [p.name.trim().toLowerCase(), p._id]));

    const defaultCategory = await Category.findOne().select('_id').lean();

    let imported = 0;
    let skipped = 0;
    let created = 0;

    for (const row of rows) {
      const productName = (row.name || row.Name || row.NAME || '').toString().trim();
      const masterPrice = Number(row.price || row.Price || row.PRICE);

      if (!productName || isNaN(masterPrice) || masterPrice < 0) {
        skipped++;
        continue;
      }

      const existingId = nameToProduct[productName.toLowerCase()];
      if (existingId) {
        await Product.findByIdAndUpdate(existingId, { masterPrice });
        imported++;
        continue;
      }

      const slugBase = productName
        .toLowerCase()
        .replace(/[^a-z0-9آ-ی\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
      const slug = `${slugBase}-${crypto.randomBytes(4).toString('hex')}`;

      try {
        await Product.create({
          name: productName,
          slug,
          description: productName,
          price: 0,
          masterPrice,
          stock: 0,
          category: defaultCategory?._id,
          isActive: true,
        });
        created++;
      } catch {
        skipped++;
      }
    }

    fs.unlink(filePath, () => {});

    res.json({
      success: true,
      message: `${imported} به‌روزرسانی شد، ${created} محصول جدید ایجاد شد، ${skipped} رد شد.`,
      imported,
      created,
      skipped,
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

/* ─── Admin Seller Orders ─── */

exports.getSellerOrders = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { type: 'seller' };

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id').lean();
      const userIds = users.map(u => u._id);

      filter.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name username phone')
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

exports.updateSellerOrderStatus = async (req, res, next) => {
  try {
    const { sellerStatus } = req.body;
    const validStatuses = ['in_progress', 'calling', 'called', 'accept', 'sent', 'cancelled'];
    if (!validStatuses.includes(sellerStatus)) {
      return next(new AppError('وضعیت نامعتبر است', 400));
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, type: 'seller' },
      { sellerStatus },
      { new: true }
    );
    if (!order) return next(new AppError('سفارش یافت نشد', 404));
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.deleteSellerOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, type: 'seller' });
    if (!order) return next(new AppError('سفارش یافت نشد', 404));

    const noRestoreStatuses = ['delivered', 'shipped'];
    if (!noRestoreStatuses.includes(order.sellerStatus)) {
      await Promise.all(order.items.map(item =>
        Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: 0 } },
          { $inc: { stock: item.qty } }
        )
      ));
    }
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'سفارش حذف شد' });
  } catch (err) {
    next(err);
  }
};

exports.exportOrdersCsv = async (req, res, next) => {
  try {
    const orders = await Order.find({ type: 'customer' })
      .populate('user', 'name phone')
      .limit(10000)
      .lean();

    const statusMap = { pending: 'در انتظار', processing: 'در حال پردازش', shipped: 'ارسال شده', delivered: 'تحویل شده', cancelled: 'لغو شده' };
    const paymentMap = { pending: 'در انتظار', paid: 'پرداخت شده', failed: 'ناموفق', refunded: 'بازگشت داده شده' };

    const rows = orders.map((o) => ({
      id: o._id.toString().slice(-8),
      customer: o.user?.name || '',
      phone: o.user?.phone || '',
      totalAmount: o.totalAmount,
      discountAmount: o.discountAmount || 0,
      status: statusMap[o.status] || o.status,
      paymentStatus: paymentMap[o.paymentStatus] || o.paymentStatus,
      province: o.shippingAddress?.province || '',
      city: o.shippingAddress?.city || '',
      createdAt: new Date(o.createdAt).toLocaleDateString('fa-IR'),
    }));

    const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) {
    next(err);
  }
};
