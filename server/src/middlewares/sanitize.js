const xss = require('xss');

const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'noscript'],
};

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const sanitizeValue = (val) => {
  if (typeof val === 'string') return xss(val, xssOptions);
  if (Array.isArray(val)) return val.map((v) => sanitizeValue(v));
  if (val && typeof val === 'object' && !(val instanceof Date)) {
    const sanitized = {};
    for (const [k, v] of Object.entries(val)) {
      if (DANGEROUS_KEYS.has(k)) continue;
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return val;
};

const sanitizeBody = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

module.exports = sanitizeBody;
