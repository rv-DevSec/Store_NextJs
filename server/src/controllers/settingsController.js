const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const SiteSettings = require('../models/SiteSettings');

const getAuthUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    return await User.findById(decoded.id).select('role').lean();
  } catch {
    return null;
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await SiteSettings.findOne().populate('festival.products', 'name slug price discountPrice images');
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    const result = settings.toObject();
    if (Array.isArray(result.phones) && result.phones.length > 0 && typeof result.phones[0] === 'string') {
      result.phones = result.phones.map(tel => ({ name: '', tel }));
    }
    const authUser = await getAuthUser(req);
    if (!authUser) {
      result.cardToCard = { active: result.cardToCard?.active || false };
    }
    res.json({ success: true, settings: result });
  } catch (err) {
    next(err);
  }
};

const ALLOWED_FIELDS = ['headerImage', 'phones', 'email', 'address', 'about', 'shippingPrice', 'zarinpalMerchantId', 'festival', 'cardToCard', 'zarinpal'];
const STRING_FIELDS = ['headerImage', 'email', 'address', 'about', 'zarinpalMerchantId', 'bankName', 'cardNumber', 'accountHolder', 'shaba', 'title', 'subtitle', 'btnText', 'bgColor'];
const NUMERIC_FIELDS = ['products', 'shippingPrice'];

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings();
    }
    for (const key of Object.keys(req.body)) {
      if (ALLOWED_FIELDS.includes(key)) {
        const val = req.body[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          const sanitized = {};
          for (const [k, v] of Object.entries(val)) {
            if (STRING_FIELDS.includes(k) && typeof v === 'string') sanitized[k] = v;
            else if (k === 'active' && typeof v === 'boolean') sanitized[k] = v;
            else if (k === 'topBanner' && typeof v === 'boolean') sanitized[k] = v;
            else if (k === 'topBannerText' && typeof v === 'string') sanitized[k] = v;
            else if (k === 'bgColor' && typeof v === 'string') sanitized[k] = v;
            else if (k === 'products' && Array.isArray(v)) sanitized[k] = v;
          }
          settings[key] = sanitized;
        } else if (key === 'phones' && Array.isArray(val)) {
          settings[key] = val.filter(v => v && typeof v === 'object' && typeof v.name === 'string' && typeof v.tel === 'string').map(v => ({ name: v.name, tel: v.tel }));
        } else if (NUMERIC_FIELDS.includes(key) && typeof val === 'number') {
          settings[key] = val;
        } else if (typeof val === 'string') {
          settings[key] = val;
        }
      }
    }
    await settings.save();
    const populated = await SiteSettings.findById(settings._id).populate('festival.products', 'name slug price discountPrice images');
    res.json({ success: true, settings: populated });
  } catch (err) {
    next(err);
  }
};
