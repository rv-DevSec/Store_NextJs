'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getSettings, getCategories } from '@/services/productService';

const Footer = () => {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const settings = data?.settings;
  const phones: { name?: string; tel?: string }[] = settings?.phones || [];
  const email: string = settings?.email || '';
  const address: string = settings?.address || '';
  const categories: { _id: string; name: string }[] = categoriesData?.categories || [];

  return (
    <footer className="bg-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div>
            <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">فروشگاه قطعات یدکی خودرو</h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
              عرضه کننده انواع قطعات یدکی خودروهای ایرانی و خارجی با بهترین کیفیت و کمترین قیمت
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm md:text-base mb-2 md:mb-3">دسترسی سریع</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white transition">خانه</Link></li>
              <li><Link href="/products" className="hover:text-white transition">محصولات</Link></li>
              <li><Link href="/categories" className="hover:text-white transition">دسته‌بندی‌ها</Link></li>
              <li><Link href="/about" className="hover:text-white transition">درباره ما</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm md:text-base mb-2 md:mb-3">دسته‌بندی‌ها</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-400">
              {categories.length > 0 ? (
                categories.slice(0, 6).map((cat) => (
                  <li key={cat._id}>
                    <Link href={`/products?category=${cat._id}`} className="hover:text-white transition">{cat.name}</Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/products" className="hover:text-white transition">همه محصولات</Link></li>
                </>
              )}
              <li><Link href="/cars" className="hover:text-white transition">خودروها</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm md:text-base mb-2 md:mb-3">اطلاعات تماس</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-400">
              {phones.filter(p => p.tel).map((p, i) => (
                <li key={i}>{p.name ? `${p.name}: ${p.tel}` : p.tel}</li>
              ))}
              {email && <li>ایمیل: {email}</li>}
              {address && <li>آدرس: {address}</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 md:mt-8 pt-4 md:pt-6 text-center text-xs md:text-sm text-gray-500">
          <p>کلیه حقوق مادی و معنوی این سایت محفوظ است &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
