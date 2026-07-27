const ALLOWED_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'aol.com',
  'ymail.com',
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  'zoho.com',
  'gmx.com',
  'gmx.net',
  'fastmail.com',
  'mailfa.com',
  'iranmail.com',
  'chmail.ir',
]);

const validateEmailDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return ALLOWED_DOMAINS.has(domain);
};

module.exports = { validateEmailDomain };
