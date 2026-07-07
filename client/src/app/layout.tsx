import type { Metadata } from 'next';
import { Providers } from '@/providers';
import './globals.css';

const siteTitle = 'فروشگاه قطعات یدکی خودرو';
const siteDescription = 'فروشگاه تخصصی قطعات یدکی خودروهای ایرانی و خارجی با بهترین کیفیت و قیمت';

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: 'website',
    locale: 'fa_IR',
    siteName: siteTitle,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
