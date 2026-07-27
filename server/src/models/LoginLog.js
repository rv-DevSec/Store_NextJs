const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'seller', ''], default: '' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  status: { type: String, enum: ['success', 'failed'], required: true },
  failReason: { type: String, default: '' },
}, { timestamps: true });

loginLogSchema.index({ createdAt: -1 });
loginLogSchema.index({ user: 1, createdAt: -1 });
loginLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('LoginLog', loginLogSchema);
