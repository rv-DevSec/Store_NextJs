import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import BackToTop from '@/components/common/BackToTop';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import ScrollToTop from '@/components/common/ScrollToTop';
import Header from '@/components/layout/ClientHeader';
import TopBanner from '@/components/common/TopBanner';

const siteTitle = 'فروشگاه قطعات یدکی خودرو';

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: 'فروشگاه تخصصی قطعات یدکی خودروهای ایرانی و خارجی با بهترین کیفیت و قیمت',
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: siteTitle,
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
      <WhatsAppButton />
    </div>
  );
}
