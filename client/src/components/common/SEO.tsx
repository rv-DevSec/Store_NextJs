'use client';

import { useEffect } from 'react';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE, LOCALE, toAbsoluteUrl } from '@/lib/seo';

interface Props {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  canonicalPath?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const upsertJsonLd = (data: Record<string, unknown>) => {
  let el = document.getElementById('seo-jsonld') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'seo-jsonld';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

const SEO = ({ title, description, image, type = 'website', canonicalPath, jsonLd }: Props) => {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const pageDescription = description || SITE_DESCRIPTION;
    const pageImage = toAbsoluteUrl(image || DEFAULT_OG_IMAGE);
    const canonical = canonicalPath
      ? toAbsoluteUrl(canonicalPath)
      : typeof window !== 'undefined'
        ? window.location.href.split('?')[0]
        : SITE_URL;

    document.title = pageTitle;

    upsertMeta('name', 'description', pageDescription);

    upsertLink('canonical', canonical);

    upsertMeta('property', 'og:title', pageTitle);
    upsertMeta('property', 'og:description', pageDescription);
    upsertMeta('property', 'og:image', pageImage);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', LOCALE);
    upsertMeta('property', 'og:locale:alternate', 'en_US');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', pageTitle);
    upsertMeta('name', 'twitter:description', pageDescription);
    upsertMeta('name', 'twitter:image', pageImage);

    if (jsonLd) {
      const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      upsertJsonLd({ '@context': 'https://schema.org', '@graph': payload });
    }
  }, [title, description, image, type, canonicalPath, jsonLd]);

  return null;
};

export default SEO;
