'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useProducts, useCars } from '@/lib/hooks/useProducts';
import CarIcon from '@/components/ui/CarIcon';
import { formatPrice } from '@/lib/utils/numbers';
import SEO from '@/components/common/SEO';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { useHidePrices } from '@/lib/hooks/useSettings';
import type { IProduct } from '@/types';

const Home = () => {
  const { data: featuredData, isLoading: loadingFeatured } = useProducts({ featured: 'true', limit: 6 });
  const { data: carsData } = useCars();
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
  const allCars: { _id: string; brand: string; model: string; image?: string }[] = [];
  if (carsData?.brands) {
    for (const brand of carsData.brands) {
      for (const m of brand.models) {
        allCars.push({ _id: m._id, brand: brand.brand, model: m.model, image: m.image });
      }
    }
  }
  const phones: { name?: string; tel?: string }[] = Array.isArray(settings?.phones) ? settings.phones : [];
  const hidePrices = useHidePrices();

  return (
    <div>
      <SEO />

      {festival?.active && (
        <section>
          <div className="py-4 md:py-6 text-center text-white" style={{ backgroundColor: festival.bgColor || '#dc2626' }}>
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                <h2 className="text-lg md:text-2xl font-bold">{festival.title || 'فروش ویژه'}</h2>
                {festival.subtitle && <p className="text-sm md:text-base opacity-90 font-bold">{festival.subtitle}</p>}
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
                      {hidePrices ? (
                        <p className="text-xs font-bold text-primary">برای اطلاع از قیمت تماس بگیرید</p>
                      ) : p.discountPrice ? (
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
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
              {phones.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
                    <p className="text-xs text-blue-200 mb-2 font-medium">تلفن تماس</p>
                    <div className="flex flex-col gap-2">
                      {phones.map((p, i) => (
                        <a
                          key={i}
                          href={`tel:${p.tel}`}
                          dir="ltr"
                          className="flex items-center gap-2 text-white font-bold text-lg md:text-xl hover:text-secondary transition whitespace-nowrap"
                        >
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {p.name ? `${p.name}: ${p.tel}` : p.tel}
                        </a>
                      ))}
                    </div>
                    <p className="text-[10px] text-blue-200 mt-2 leading-relaxed">برای اطلاع دقیق از قیمت‌های نمایندگی تماس بگیرید</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">خودروی خود را انتخاب کنید</h2>
            <Link href="/cars" className="text-primary hover:underline text-sm">مشاهده همه</Link>
          </div>
          {allCars.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allCars.slice(0, 8).map((car, idx) => (
                <Link
                  key={car._id}
                  href={`/products?car=${car._id}`}
                  className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] hover:border-primary transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-400 overflow-hidden group-hover:bg-gray-50 transition-colors duration-300">
                    {car.image ? (
                      <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <CarIcon className="w-16 h-12 group-hover:scale-110 transition-transform duration-300" />
                    )}
                  </div>
                  <h3 className="text-xs font-bold truncate group-hover:text-primary transition-colors duration-200">{car.brand} {car.model}</h3>
                </Link>
              ))}
            </div>
          )}
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

    </div>
  );
};

export default Home;
