const mongoose = require('mongoose');

const productRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  productName: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'resolved'],
    default: 'pending',
  },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

productRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ProductRequest', productRequestSchema);
