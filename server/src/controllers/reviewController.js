const Review = require('../models/Review');
const Product = require('../models/Product');
const { AppError } = require('../middlewares/errorHandler');

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

exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).select('_id').lean();
    if (!product) {
      return next(new AppError('محصول مورد نظر یافت نشد', 404));
    }

    const reviews = await Review.find({ product: productId, status: 'approved' })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reviews, count: reviews.length });
  } catch (err) {
    next(err);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { product: productId, rating, comment } = req.body;

    const product = await Product.findById(productId).select('_id').lean();
    if (!product) {
      return next(new AppError('محصول مورد نظر یافت نشد', 404));
    }

    const existing = await Review.findOne({ user: req.user._id, product: productId }).lean();
    if (existing) {
      return next(new AppError('شما قبلاً برای این محصول نظر ثبت کرده‌اید', 400));
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      comment,
    });

    const populated = await Review.findById(review._id)
      .populate('user', 'name')
      .lean();

    res.status(201).json({ success: true, review: populated });
  } catch (err) {
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new AppError('نظر یافت نشد', 404));
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('شما اجازه ویرایش این نظر را ندارید', 403));
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return next(new AppError('امتیاز باید بین ۱ تا ۵ باشد', 400));
      }
      review.rating = rating;
    }
    if (comment !== undefined) {
      review.comment = comment;
    }

    review.status = 'pending';
    await review.save();

    const populated = await Review.findById(review._id)
      .populate('user', 'name')
      .lean();

    res.json({ success: true, review: populated, message: 'نظر شما پس از تأیید مدیر نمایش داده خواهد شد' });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new AppError('نظر یافت نشد', 404));
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('شما اجازه حذف این نظر را ندارید', 403));
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);
    await updateProductRating(productId);

    res.json({ success: true, message: 'نظر حذف شد' });
  } catch (err) {
    next(err);
  }
};

exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};
