const path = require('path');
const fs = require('fs');
const { AppError } = require('../middlewares/errorHandler');

const uploadDir = path.resolve(__dirname, '../../uploads');

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('لطفاً یک تصویر انتخاب کنید', 400));
    }

    const url = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url,
      filename: req.file.filename,
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('لطفاً تصاویر را انتخاب کنید', 400));
    }

    const urls = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
    }));

    res.json({
      success: true,
      images: urls,
    });
  } catch (err) {
    next(err);
  }
};
