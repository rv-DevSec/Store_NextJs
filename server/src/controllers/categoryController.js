const Category = require('../models/Category');
const Product = require('../models/Product');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id, isActive: true });
        return { ...cat, productCount: count };
      })
    );

    res.json({ success: true, categories: categoriesWithCount });
  } catch (err) {
    next(err);
  }
};
