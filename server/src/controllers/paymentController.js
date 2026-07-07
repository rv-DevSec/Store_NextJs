const crypto = require('crypto');
const https = require('https');
const Order = require('../models/Order');
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
    if (!order.paymentInfo.nonce) {
      order.paymentInfo.nonce = crypto.randomBytes(16).toString('hex');
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

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('سفارش یافت نشد', 404));
    }

    if (!order.paymentInfo?.nonce || order.paymentInfo.nonce !== nonce) {
      auditLog('verify_nonce_mismatch', { orderId: order._id.toString(), authority: Authority, receivedNonce: nonce });
      return res.redirect(`${config.clientUrl}/payment/result?status=failed&orderId=${order._id}`);
    }

    if (order.paymentStatus === 'paid') {
      return res.redirect(`${config.clientUrl}/payment/result?status=success&orderId=${order._id}`);
    }
    if (order.paymentStatus === 'refunded') {
      return res.redirect(`${config.clientUrl}/payment/result?status=failed&orderId=${order._id}`);
    }

    if (Status !== 'OK') {
      order.paymentStatus = 'failed';
      await order.save();
      auditLog('verify_cancelled', { orderId: order._id.toString(), authority: Authority });
      return res.redirect(`${config.clientUrl}/payment/result?status=failed&orderId=${order._id}`);
    }

    const host = getHost();
    const merchantId = getMerchantId();

    const verifyData = JSON.stringify({
      merchant_id: merchantId,
      authority: Authority,
      amount: order.totalAmount,
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
            // Consume nonce AFTER successful verification (prevents replay but allows retry on network failure)
            order.paymentInfo.nonce = undefined;
            order.paymentStatus = 'paid';
            order.status = 'processing';
            order.paymentInfo.refId = String(result.data.ref_id);
            order.paymentInfo.cardPan = result.data.card_pan || '';
            order.paymentInfo.fee = result.data.fee;
            order.paymentInfo.feeType = result.data.fee_type;
            await order.save();

            auditLog('verify_success', { orderId: order._id.toString(), refId: result.data.ref_id, authority: Authority });

            return res.redirect(
              `${config.clientUrl}/payment/result?status=success&orderId=${order._id}&refId=${result.data.ref_id}`
            );
          } else {
            order.paymentStatus = 'failed';
            await order.save();
            auditLog('verify_failed', { orderId: order._id.toString(), authority: Authority, code: result.data?.code });
            return res.redirect(
              `${config.clientUrl}/payment/result?status=failed&orderId=${order._id}`
            );
          }
        } catch (parseErr) {
          return res.redirect(
            `${config.clientUrl}/payment/result?status=error&orderId=${order._id}`
          );
        }
      });
    });

    verifyRequest.on('error', () => {
      return res.redirect(
        `${config.clientUrl}/payment/result?status=error&orderId=${order._id}`
      );
    });

    verifyRequest.write(verifyData);
    verifyRequest.end();
  } catch (err) {
    next(err);
  }
};
