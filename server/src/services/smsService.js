/**
 * SMS provider abstraction.
 *
 * To integrate a real SMS provider (e.g. Kavenegar, SMS.ir, Melipayamak):
 *   1. Implement the `sendVerificationCode` method below (or swap the provider
 *      module used by the auth flow).
 *   2. Flip `SMS_VERIFICATION_ENABLED=true` in the environment.
 *
 * Nothing else in the authentication system needs to change — the auth
 * controller only ever calls `smsService.sendVerificationCode(phone, code)`.
 */
const config = require('../config');

exports.sendVerificationCode = async (phone, code) => {
  if (config.nodeEnv !== 'production') {
    // In development there is no real SMS provider, so surface the code in the
    // server log so the verification flow can be exercised end-to-end.
    // eslint-disable-next-line no-console
    console.log(`[SMS][DEV] Verification code for ${phone}: ${code}`);
  }
  return { success: true, provider: 'none' };
};
