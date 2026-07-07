const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');

exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses').lean();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.createAddress = async (req, res, next) => {
  try {
    const { title, province, city, fullAddress, postalCode, phone } = req.body;
    const user = await User.findById(req.user._id);
    user.addresses.push({ title, province, city, fullAddress, postalCode, phone });
    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(id);
    if (!addr) return next(new AppError('آدرس یافت نشد', 404));
    const { title, province, city, fullAddress, postalCode, phone } = req.body;
    if (title !== undefined) addr.title = title;
    if (province !== undefined) addr.province = province;
    if (city !== undefined) addr.city = city;
    if (fullAddress !== undefined) addr.fullAddress = fullAddress;
    if (postalCode !== undefined) addr.postalCode = postalCode;
    if (phone !== undefined) addr.phone = phone;
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    user.addresses.pull(id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};
