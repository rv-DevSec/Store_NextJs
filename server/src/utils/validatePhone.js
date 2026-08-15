const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

const toLatinDigits = (input) => {
  return String(input).replace(/[۰-۹]/g, (d) => PERSIAN_DIGITS.indexOf(d))
    .replace(/[٠-٩]/g, (d) => ARABIC_DIGITS.indexOf(d));
};

// Normalize an Iranian mobile number to the canonical 09XXXXXXXXX form.
// Handles +98 / 0098 prefixes, Persian/Arabic digits and whitespace/dashes.
const normalizePhone = (input) => {
  if (!input) return '';
  let digits = toLatinDigits(input)
    .replace(/[\s\-().]/g, '');
  if (digits.startsWith('+98')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('0098')) digits = `0${digits.slice(4)}`;
  return digits;
};

const isValidPhone = (input) => {
  const normalized = normalizePhone(input);
  return /^09\d{9}$/.test(normalized);
};

module.exports = { normalizePhone, isValidPhone };
