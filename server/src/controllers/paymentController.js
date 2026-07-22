const crypto = require('crypto');
const https = require('https');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const config = require('../config');
const { AppError } = require('../middlewares/errorHandler');

const auditLog = (event, data) => {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), type: 'payment_audit', event, ...data }));
};

const PROD_HOST = 'payment.zarinpal.com';
const SANDBOX_HOST = 'sandbox.zarinpal.com';

const SANDBOX_MERCHANT_ID = '00000000-0000-0000-0000-000000000000';

const getHost = () => (config.nodeEnv === 'production' ? PROD_HOST : SANDBOX_HOST);

const getMerchantId = () => {
  if (config.nodeEnv === 'production') {
    return config.zarinpalMerchantId;
  }
  return config.zarinpalMerchantId || SANDBOX_MERCHANT_ID;
};

const restoreStock = async (items) => {
  if (!items || items.length === 0) return;
  await Promise.all(items.map(item =>
    Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } })
  ));
};

exports.requestPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate('user', 'mobile email');
    if (!order) {
      return next(new AppError('سفارش یافت نشد', 404));
    }

    if (order.user._id.toString() !== req.user._id.toString()) {
      return next(new AppError('دسترسی غیرمجاز', 403));
    }

    if (order.paymentStatus === 'paid') {
      return next(new AppError('این سفارش قبلاً پرداخت شده است', 400));
    }

    const settings = await SiteSettings.findOne();
    if (!config.zarinpalMerchantId || !settings?.zarinpal?.enabled) {
      return next(new AppError('پرداخت آنلاین (زرین‌پال) فعلاً غیرفعال است', 400));
    }

    const host = getHost();
    const merchantId = getMerchantId();
    if (!order.paymentInfo) order.paymentInfo = {};
    if (!order.paymentInfo.nonce || !order.paymentInfo.authority) {
      order.paymentInfo.nonce = crypto.randomBytes(16).toString('hex');
      if (order.paymentInfo.authority) delete order.paymentInfo.authority;
      await order.save();
    }
    const nonce = order.paymentInfo.nonce;
    const callbackUrl = `${config.clientUrl}/api/payment/zarinpal/callback?orderId=${order._id}&nonce=${nonce}`;
    const amount = order.totalAmount;

    const requestData = JSON.stringify({
      merchant_id: merchantId,
      amount,
      description: `پرداخت سفارش #${order._id.toString().slice(-8)}`,
      callback_url: callbackUrl,
      currency: 'IRT',
      metadata: {
        mobile: order.user.phone || '',
        email: order.user.email || '',
        order_id: order._id.toString(),
      },
    });

    const options = {
      hostname: host,
      path: '/pg/v4/payment/request.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
      },
    };

    const zapRequest = https.request(options, (zapRes) => {
      let data = '';
      zapRes.on('data', (chunk) => (data += chunk));
      zapRes.on('end', async () => {
        try {
          const result = JSON.parse(data);

          if (result.data?.code === 100 && result.data?.authority) {
            order.paymentInfo.authority = result.data.authority;
            await order.save();

            auditLog('request_success', { userId: req.user?._id?.toString(), orderId: order._id.toString(), amount: order.totalAmount, authority: result.data.authority });

            res.json({
              success: true,
              authority: result.data.authority,
              redirectUrl: `https://${host}/pg/StartPay/${result.data.authority}`,
            });
          } else {
            auditLog('request_failed', { userId: req.user?._id?.toString(), orderId: order._id.toString(), amount: order.totalAmount, response: result });
            const errMsg = result.errors?.[0]?.message || 'خطا در اتصال به درگاه پرداخت';
            return next(new AppError(errMsg, 500));
          }
        } catch (parseErr) {
          return next(new AppError('خطا در پردازش پاسخ درگاه', 500));
        }
      });
    });

    zapRequest.on('error', () => {
      return next(new AppError('خطا در اتصال به درگاه پرداخت', 500));
    });

    zapRequest.write(requestData);
    zapRequest.end();
  } catch (err) {
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { Authority, Status, orderId, nonce } = req.query;

    // Phase 1: atomically claim this verification — prevents race between concurrent callbacks
    const claimed = await Order.findOneAndUpdate(
      {
        _id: orderId,
        paymentStatus: 'pending',
        'paymentInfo.nonce': nonce,
      },
      {
        $set: { paymentStatus: 'verifying' },
        $unset: { 'paymentInfo.nonce': '' },
      },
      { new: true }
    );

    if (!claimed) {
      const order = await Order.findById(orderId).lean();
      if (order?.paymentStatus === 'paid') {
        return res.redirect(`${config.clientUrl}/payment/result?status=success&orderId=${order._id}`);
      }
      if (order?.paymentStatus === 'failed' || order?.paymentStatus === 'refunded') {
        return res.redirect(`${config.clientUrl}/payment/result?status=failed&orderId=${order._id}`);
      }
      return res.redirect(`${config.clientUrl}/payment/result?status=failed&orderId=${orderId}`);
    }

    // User cancelled on Zarinpal page
    if (Status !== 'OK') {
      await restoreStock(claimed.items);
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
      auditLog('verify_cancelled', { orderId, authority: Authority });
      return res.redirect(`${config.clientUrl}/payment/result?status=failed&orderId=${orderId}`);
    }

    const host = getHost();
    const merchantId = getMerchantId();

    const verifyData = JSON.stringify({
      merchant_id: merchantId,
      authority: Authority,
      amount: claimed.totalAmount,
    });

    const options = {
      hostname: host,
      path: '/pg/v4/payment/verify.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(verifyData),
      },
    };

    const verifyRequest = https.request(options, (verifyRes) => {
      let data = '';
      verifyRes.on('data', (chunk) => (data += chunk));
      verifyRes.on('end', async () => {
        try {
          const result = JSON.parse(data);

          if (result.data?.code === 100 || result.data?.code === 101) {
            // Atomically finalize — only succeeds if still in 'verifying' state
            const updated = await Order.findOneAndUpdate(
              { _id: orderId, paymentStatus: 'verifying' },
              {
                $set: {
                  paymentStatus: 'paid',
                  status: 'processing',
                  'paymentInfo.nonce': undefined,
                  'paymentInfo.refId': String(result.data.ref_id),
                  'paymentInfo.cardPan': result.data.card_pan || '',
                  'paymentInfo.fee': result.data.fee,
                  'paymentInfo.feeType': result.data.fee_type,
                },
              },
              { new: true }
            );

            if (!updated) {
              auditLog('verify_race_lost', { orderId, authority: Authority, code: result.data.code });
            }

            auditLog('verify_success', { orderId, refId: result.data.ref_id, authority: Authority });

            return res.redirect(
              `${config.clientUrl}/payment/result?status=success&orderId=${orderId}&refId=${result.data.ref_id}`
            );
          } else {
            await restoreStock(claimed.items);
            await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
            auditLog('verify_failed', { orderId, authority: Authority, code: result.data?.code });
            return res.redirect(
              `${config.clientUrl}/payment/result?status=failed&orderId=${orderId}`
            );
          }
        } catch (parseErr) {
          return res.redirect(
            `${config.clientUrl}/payment/result?status=error&orderId=${orderId}`
          );
        }
      });
    });

    verifyRequest.on('error', async () => {
      await restoreStock(claimed.items);
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
      auditLog('verify_network_error', { orderId, authority: Authority });
      return res.redirect(
        `${config.clientUrl}/payment/result?status=error&orderId=${orderId}`
      );
    });

    verifyRequest.write(verifyData);
    verifyRequest.end();
  } catch (err) {
    next(err);
  }
};
