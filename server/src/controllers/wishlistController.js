const User = require('../models/User');

exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('favorites')
      .populate('favorites')
      .lean();
    res.json({ success: true, products: user.favorites });
  } catch (err) {
    next(err);
  }
};

exports.toggleFavorite = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    const idx = user.favorites.indexOf(productId);
    if (idx > -1) {
      user.favorites.splice(idx, 1);
    } else {
      user.favorites.push(productId);
    }
    await user.save();
    res.json({ success: true, isFavorited: idx === -1 });
  } catch (err) {
    next(err);
  }
};
