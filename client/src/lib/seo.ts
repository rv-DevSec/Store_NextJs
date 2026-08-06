export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gostaryadak.ir';
export const SITE_NAME = 'فروشگاه قطعات یدکی خودرو';
export const SITE_DESCRIPTION = 'فروشگاه تخصصی قطعات یدکی خودروهای ایرانی و خارجی با بهترین کیفیت و قیمت';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOCALE = 'fa_IR';

export const toAbsoluteUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
