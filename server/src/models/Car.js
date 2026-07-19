const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number },
    engineType: { type: String },
    image: { type: String },
    slug: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

carSchema.index({ brand: 1, model: 1 });
carSchema.index({ slug: 1 });

module.exports = mongoose.model('Car', carSchema);
