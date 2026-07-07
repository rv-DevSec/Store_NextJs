const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  headerImage: { type: String, default: '' },
  festival: {
    active: { type: Boolean, default: false },
    title: { type: String, default: 'فروش ویژه' },
    subtitle: { type: String, default: 'تخفیف‌های باورنکردنی در انتظار شماست' },
    btnText: { type: String, default: 'مشاهده محصولات' },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    bgColor: { type: String, default: '#dc2626' },
  },
  cardToCard: {
    active: { type: Boolean, default: false },
    bankName: { type: String, default: '' },
    cardNumber: { type: String, default: '' },
    accountHolder: { type: String, default: '' },
    shaba: { type: String, default: '' },
  },
  zarinpal: {
    enabled: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
