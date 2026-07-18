const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  image: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    shippingCost: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['zarinpal', 'cod', 'card-to-card', 'seller'], default: 'zarinpal' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentInfo: {
      authority: { type: String },
      refId: { type: String },
      cardPan: { type: String },
      fee: { type: Number },
      feeType: { type: String },
      transactionId: { type: String },
      receiptImage: { type: String },
      nonce: { type: String },
    },
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      province: { type: String },
      city: { type: String },
      fullAddress: { type: String },
      postalCode: { type: String },
    },
    type: { type: String, enum: ['customer', 'seller'], default: 'customer' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sellerStatus: { type: String, enum: ['in_progress', 'calling', 'called', 'accept', 'sent', 'cancelled'] },
    sellerNote: { type: String },
    orderId: { type: String, unique: true, sparse: true },
    trackingCode: { type: String },
    note: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ trackingCode: 1 });
orderSchema.index({ type: 1, createdAt: -1 });
orderSchema.index({ sellerStatus: 1 });
orderSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
