const ProductRequest = require('../models/ProductRequest');
const { AppError } = require('../middlewares/errorHandler');

exports.createRequest = async (req, res, next) => {
  try {
    const { name, phone, productName, description } = req.body;
    if (!name || !phone || !productName) {
      return next(new AppError('نام، شماره تماس و نام محصول الزامی است', 400));
    }
    const request = await ProductRequest.create({ name, phone, productName, description });
    res.status(201).json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

exports.getRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      ProductRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProductRequest.countDocuments(filter),
    ]);

    res.json({
      success: true,
      requests,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateRequest = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = adminNote;

    const request = await ProductRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!request) {
      return next(new AppError('درخواست یافت نشد', 404));
    }
    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await ProductRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return next(new AppError('درخواست یافت نشد', 404));
    }
    res.json({ success: true, message: 'حذف شد' });
  } catch (err) {
    next(err);
  }
};
