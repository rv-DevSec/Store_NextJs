const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');

const COLLECTIONS = {
  products: { model: Product, label: 'محصولات' },
  orders: { model: Order, label: 'سفارشات' },
  users: { model: User, label: 'کاربران' },
};

const buildEnvelope = (collection, data) => ({
  version: '1.0',
  exportedAt: new Date().toISOString(),
  collection,
  count: data.length,
  data,
});

const downloadJson = (res, filename, payload) => {
  const json = JSON.stringify(payload, null, 2);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + json);
};

/* ─── Backup (Download) ─── */

exports.backupProducts = async (req, res, next) => {
  try {
    const data = await Product.find().populate('category', 'name').lean();
    const ts = new Date().toISOString().slice(0, 10);
    downloadJson(res, `backup-products-${ts}.json`, buildEnvelope('products', data));
  } catch (err) {
    next(err);
  }
};

exports.backupOrders = async (req, res, next) => {
  try {
    const data = await Order.find()
      .populate('user', 'name phone')
      .populate('seller', 'name phone')
      .populate('coupon', 'code type value')
      .lean();
    const ts = new Date().toISOString().slice(0, 10);
    downloadJson(res, `backup-orders-${ts}.json`, buildEnvelope('orders', data));
  } catch (err) {
    next(err);
  }
};

exports.backupUsers = async (req, res, next) => {
  try {
    const data = await User.find()
      .select('+password +refreshTokens +resetPasswordToken +resetPasswordExpire +phoneVerificationCode +phoneVerificationCodeExpire')
      .lean();
    const ts = new Date().toISOString().slice(0, 10);
    downloadJson(res, `backup-users-${ts}.json`, buildEnvelope('users', data));
  } catch (err) {
    next(err);
  }
};

exports.backupAll = async (req, res, next) => {
  try {
    const [products, orders, users] = await Promise.all([
      Product.find().populate('category', 'name').lean(),
      Order.find()
        .populate('user', 'name phone')
        .populate('seller', 'name phone')
        .populate('coupon', 'code type value')
        .lean(),
      User.find()
        .select('+password +refreshTokens +resetPasswordToken +resetPasswordExpire +phoneVerificationCode +phoneVerificationCodeExpire')
        .lean(),
    ]);
    const ts = new Date().toISOString().slice(0, 10);
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      collections: { products, orders, users },
      counts: { products: products.length, orders: orders.length, users: users.length },
    };
    downloadJson(res, `backup-all-${ts}.json`, payload);
  } catch (err) {
    next(err);
  }
};

/* ─── Restore (Upload) ─── */

const parseBackupFile = (file) => {
  if (!file) throw new AppError('فایل پشتیبان الزامی است', 400);
  try {
    const content = require('fs').readFileSync(file.path, 'utf-8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(content);
    require('fs').unlink(file.path, () => {});
    return parsed;
  } catch {
    require('fs').unlink(file.path, () => {});
    throw new AppError('فایل پشتیبان نامعتبر است', 400);
  }
};

const validateCollection = (parsed, expected) => {
  if (parsed.collections) {
    if (!parsed.collections[expected]) {
      throw new AppError(`مجموعه "${expected}" در فایل پشتیبان یافت نشد`, 400);
    }
    return parsed.collections[expected];
  }
  if (parsed.collection !== expected) {
    throw new AppError(`فایل پشتیبان مربوط به "${COLLECTIONS[parsed.collection]?.label || parsed.collection}" است، "${COLLECTIONS[expected].label}" انتظار می‌رفت`, 400);
  }
  if (!Array.isArray(parsed.data)) {
    throw new AppError('ساختار فایل پشتیبان نامعتبر است', 400);
  }
  return parsed.data;
};

exports.restoreProducts = async (req, res, next) => {
  try {
    const parsed = parseBackupFile(req.file);
    const data = validateCollection(parsed, 'products');
    if (!Array.isArray(data) || data.length === 0) {
      return next(new AppError('داده‌ای برای بازیابی وجود ندارد', 400));
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const item of data) {
      try {
        if (!item._id || !item.name || !item.slug) {
          errors.push(`رد شد: فیلدهای الزامی (_id, name, slug) موجود نیست`);
          continue;
        }
        const { _id, createdAt, updatedAt, __v, ...rest } = item;
        const result = await Product.findOneAndUpdate(
          { _id },
          { $set: rest },
          { upsert: true, new: true, runValidators: true }
        );
        if (result.wasNew) created++;
        else updated++;
      } catch (err) {
        errors.push(`خطا در محصول "${item.name || item._id}": ${err.message}`);
      }
    }

    res.json({
      success: true,
      created,
      updated,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      message: `${created} محصول ایجاد و ${updated} محصول بروزرسانی شد${errors.length ? ` (${errors.length} خطا)` : ''}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.restoreOrders = async (req, res, next) => {
  try {
    const parsed = parseBackupFile(req.file);
    const data = validateCollection(parsed, 'orders');
    if (!Array.isArray(data) || data.length === 0) {
      return next(new AppError('داده‌ای برای بازیابی وجود ندارد', 400));
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const item of data) {
      try {
        if (!item._id) {
          errors.push('رد شد: _id موجود نیست');
          continue;
        }
        const { _id, createdAt, updatedAt, __v, ...rest } = item;
        const result = await Order.findOneAndUpdate(
          { _id },
          { $set: rest },
          { upsert: true, new: true, runValidators: true }
        );
        if (result.wasNew) created++;
        else updated++;
      } catch (err) {
        errors.push(`خطا در سفارش "${item._id}": ${err.message}`);
      }
    }

    res.json({
      success: true,
      created,
      updated,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      message: `${created} سفارش ایجاد و ${updated} سفارش بروزرسانی شد${errors.length ? ` (${errors.length} خطا)` : ''}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.restoreUsers = async (req, res, next) => {
  try {
    const parsed = parseBackupFile(req.file);
    const data = validateCollection(parsed, 'users');
    if (!Array.isArray(data) || data.length === 0) {
      return next(new AppError('داده‌ای برای بازیابی وجود ندارد', 400));
    }

    const bcrypt = require('bcryptjs');
    let created = 0;
    let updated = 0;
    const errors = [];

    for (const item of data) {
      try {
        if (!item._id || !item.name) {
          errors.push('رد شد: فیلدهای الزامی (_id, name) موجود نیست');
          continue;
        }
        const { _id, createdAt, updatedAt, __v, ...rest } = item;

        if (rest.password && !rest.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(12);
          rest.password = await bcrypt.hash(rest.password, salt);
        }

        const result = await User.findOneAndUpdate(
          { _id },
          { $set: rest },
          { upsert: true, new: true, runValidators: true }
        );
        if (result.wasNew) created++;
        else updated++;
      } catch (err) {
        errors.push(`خطا در کاربر "${item.name || item._id}": ${err.message}`);
      }
    }

    res.json({
      success: true,
      created,
      updated,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      message: `${created} کاربر ایجاد و ${updated} کاربر بروزرسانی شد${errors.length ? ` (${errors.length} خطا)` : ''}`,
    });
  } catch (err) {
    next(err);
  }
};

/* ─── Preview (count records before restore) ─── */

exports.previewBackup = async (req, res, next) => {
  try {
    const parsed = parseBackupFile(req.file);
    const collections = parsed.collections
      ? Object.keys(parsed.collections).filter((k) => Array.isArray(parsed.collections[k]))
      : parsed.collection
        ? [parsed.collection]
        : [];

    const summary = {};
    for (const col of collections) {
      const arr = parsed.collections?.[col] || (parsed.collection === col ? parsed.data : []);
      summary[col] = Array.isArray(arr) ? arr.length : 0;
    }

    res.json({
      success: true,
      version: parsed.version || 'unknown',
      exportedAt: parsed.exportedAt || null,
      collections: summary,
    });
  } catch (err) {
    next(err);
  }
};
