import SellerLayout from '@/components/layout/ClientSellerLayout';

export default function SellerRootLayout({ children }: { children: React.ReactNode }) {
  return <SellerLayout>{children}</SellerLayout>;
}
