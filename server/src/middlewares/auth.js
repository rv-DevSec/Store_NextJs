const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('لطفاً وارد حساب کاربری خود شوید', 401));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(decoded.id).select('-password -refreshTokens -resetPasswordToken -resetPasswordExpire');
    if (!req.user) {
      return next(new AppError('کاربر یافت نشد', 401));
    }
    next();
  } catch (error) {
    return next(new AppError('توکن نامعتبر است', 401));
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return next(new AppError('دسترسی غیرمجاز', 403));
};

module.exports = { protect, admin };
