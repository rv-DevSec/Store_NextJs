'use client';

import { useEffect } from 'react';

interface Props {
  title?: string;
  description?: string;
}

const defaultTitle = 'فروشگاه قطعات یدکی خودرو';
const defaultDescription = 'فروشگاه تخصصی قطعات یدکی خودروهای ایرانی و خارجی با بهترین کیفیت و قیمت';

const SEO = ({ title, description }: Props) => {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
    document.title = pageTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description || defaultDescription);
  }, [title, description]);

  return null;
};

export default SEO;
