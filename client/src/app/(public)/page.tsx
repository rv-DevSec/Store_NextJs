'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useProducts, useCategories } from '@/lib/hooks/useProducts';
import { formatPrice, toPersianNumber } from '@/lib/utils/numbers';
import SEO from '@/components/common/SEO';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import type { IProduct } from '@/types';

const getIcon = (cat: { icon?: string; name: string }) => {
  if (cat.icon?.startsWith('/uploads/')) {
    return <img src={cat.icon} alt="" className="w-8 h-8 mx-auto object-contain group-hover:scale-110 transition-transform duration-300" />;
  }
  return <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{cat.icon || '📦'}</span>;
};

const Home = () => {
  const { data: featuredData, isLoading: loadingFeatured } = useProducts({ featured: 'true', limit: 6 });
  const { data: categoriesData } = useCategories();
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
  });

  const settings = settingsData?.settings;
  const festival = settings?.festival;
  const featuredProducts = featuredData?.products || [];
  const categories = categoriesData?.categories || [];
  const phones: string[] = Array.isArray(settings?.phones) ? settings.phones : [];

  return (
    <div>
      <SEO />

      {festival?.active && (
        <section>
          <div className="py-4 md:py-6 text-center text-white" style={{ backgroundColor: festival.bgColor || '#dc2626' }}>
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                <h2 className="text-lg md:text-2xl font-bold">{festival.title || 'فروش ویژه'}</h2>
                {festival.subtitle && <p className="text-sm md:text-base opacity-90">{festival.subtitle}</p>}
                {(!festival.products || festival.products.length === 0) && (
                  <Link
                    href="/products?featured=true"
                    className="bg-white text-gray-900 px-5 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-all duration-200 active:scale-95"
                  >
                    {festival.btnText || 'مشاهده محصولات'}
                  </Link>
                )}
              </div>
            </div>
          </div>
          {festival.products?.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {festival.products.map((p: { _id?: string; slug: string; name: string; images?: string[]; price: number; discountPrice?: number }, idx: number) => (
                  <Link
                    key={p._id || idx}
                    href={`/products/${p.slug}`}
                    className="bg-white border border-gray-200 rounded-xl p-2 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group animate-fade-in"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-300 overflow-hidden group-hover:bg-gray-50 transition-colors duration-300">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <svg className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-xs font-bold truncate group-hover:text-primary transition-colors duration-200">{p.name}</h3>
                    <div className="mt-1">
                      {p.discountPrice ? (
                        <p className="text-xs font-bold text-danger">{formatPrice(p.discountPrice)}</p>
                      ) : (
                        <p className="text-xs font-bold">{formatPrice(p.price)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section
        className={`text-white ${settings?.headerImage ? 'relative overflow-hidden' : 'bg-gradient-to-l from-primary to-primary-dark'}`}
      >
        {settings?.headerImage && (
          <img src={settings.headerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className={`relative ${settings?.headerImage ? 'bg-black/50' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                فروشگاه تخصصی قطعات یدکی خودرو
              </h1>
              <p className="text-lg md:text-xl text-blue-200 mb-8">
                انواع قطعات یدکی خودروهای ایرانی و خارجی با بهترین کیفیت و قیمت
              </p>
              <div className="flex gap-3">
                <Link
                  href="/products"
                  className="bg-secondary text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-secondary-light transition"
                >
                  مشاهده محصولات
                </Link>
                <Link
                  href="/categories"
                  className="bg-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition"
                >
                  دسته‌بندی‌ها
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">دسته‌بندی محصولات</h2>
          <Link href="/categories" className="text-primary hover:underline text-sm">مشاهده همه</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((cat: { _id: string; icon?: string; name: string; productCount?: number }, idx: number) => (
            <Link
              key={cat._id}
              href={`/products?category=${cat._id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] hover:border-primary transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="mb-2 flex justify-center">{getIcon(cat)}</div>
              <h3 className="font-bold text-sm group-hover:text-primary transition-colors duration-200">{cat.name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {toPersianNumber(cat.productCount || 0)} محصول
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">محصولات ویژه</h2>
            <Link href="/products?featured=true" className="text-primary hover:underline text-sm">مشاهده همه</Link>
          </div>
          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductCard.Shimmer key={i} idx={i} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredProducts.map((product: IProduct, idx: number) => (
                <ProductCard key={product._id} product={product} idx={idx} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🚚', title: 'ارسال سریع', desc: 'ارسال به سراسر ایران در کوتاه‌ترین زمان' },
            { icon: '✅', title: 'ضمانت اصالت کالا', desc: 'تمامی محصولات ضمانت اصالت دارند' },
            { icon: '💳', title: 'پرداخت آنلاین', desc: 'پرداخت امن از طریق درگاه زرین‌پال' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="text-4xl mb-3 hover:scale-110 transition-transform duration-300 inline-block">{item.icon}</div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {phones.length > 0 && (
        <section className="bg-primary/5 border-t border-primary/10 py-4">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-600 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="font-medium text-gray-800">تلفن تماس: </span>
              {phones.map((p, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-gray-300 mx-1">|</span>}
                  <a href={`tel:${p}`} dir="ltr" className="font-mono text-primary font-medium hover:text-primary-dark transition whitespace-nowrap">
                    {p}
                  </a>
                </span>
              ))}
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
