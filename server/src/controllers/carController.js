const Car = require('../models/Car');

exports.getCars = async (req, res, next) => {
  try {
    const cars = await Car.find({ isActive: true })
      .sort({ brand: 1, model: 1 })
      .lean();

    const brands = [...new Set(cars.map((c) => c.brand))].map((brand) => ({
      brand,
      models: cars.filter((c) => c.brand === brand).map(({ _id, model, year, slug }) => ({
        _id,
        model,
        year,
        slug,
      })),
    }));

    res.json({ success: true, brands, cars });
  } catch (err) {
    next(err);
  }
};
