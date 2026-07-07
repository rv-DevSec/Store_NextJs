import moment from 'moment-jalaali';

moment.loadPersian({ dialect: 'persian-modern' });

export const toPersianNumber = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

export const formatPrice = (price: number): string => {
  return toPersianNumber(price.toLocaleString('fa-IR')) + ' تومان';
};

export const formatDate = (date: string): string => {
  return moment(date).format('jYYYY/jM/jD');
};

export const formatDateTime = (date: string): string => {
  return moment(date).format('jYYYY/jM/jD HH:mm');
};

export const toEnglishNumber = (str: string): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str.replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)));
};
