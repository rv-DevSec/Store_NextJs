const Product = require('../models/Product');
const { AppError } = require('../middlewares/errorHandler');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      car,
      minPrice,
      maxPrice,
      featured,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { isActive: true };

    if (search && search.length < 200) {
      const safe = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (brand && brand.length < 100) {
      filter.brand = { $regex: escapeRegex(brand), $options: 'i' };
    }

    if (car) {
      filter.compatibleCars = car;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'popular':
        sortOption = { numReviews: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('compatibleCars', 'brand model')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
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

exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('compatibleCars', 'brand model year');

    if (!product) {
      return next(new AppError('محصول مورد نظر یافت نشد', 404));
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};
