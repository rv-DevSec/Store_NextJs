import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import BackToTop from '@/components/common/BackToTop';
import ContactWidget from '@/components/common/ContactWidget';
import ScrollToTop from '@/components/common/ScrollToTop';
import Header from '@/components/layout/ClientHeader';
import TopBanner from '@/components/common/TopBanner';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <TopBanner />
      <Header />
      <main className="flex-1 animate-fade-in">
        {children}
      </main>
      <Footer />
      <BackToTop />
      <ContactWidget />
    </div>
  );
}
