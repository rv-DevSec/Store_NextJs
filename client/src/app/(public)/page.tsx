'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useProducts, useCars } from '@/lib/hooks/useProducts';
import CarIcon from '@/components/ui/CarIcon';
import { formatPrice } from '@/lib/utils/numbers';
import SEO from '@/components/common/SEO';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { useHidePrices } from '@/lib/hooks/useSettings';
import { toAbsoluteUploadUrl } from '@/lib/utils/uploadUrl';
import useInView from '@/lib/hooks/useInView';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import type { IProduct } from '@/types';

const CARS_PER_PAGE_DESKTOP = 8;
const CARS_PER_PAGE_MOBILE = 4;

const SectionTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${className}`}>{children}</h2>
);

const SectionLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-light transition-colors group">
    {children}
    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

const AnimateOnScroll = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const { ref, inView } = useInView({ threshold: 0.1 });
  return (
    <div ref={ref} className={`animate-on-scroll ${inView ? 'in-view' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

const Home = () => {
  const { data: featuredData, isLoading: loadingFeatured } = useProducts({ featured: 'true', limit: 6 });
  const { data: carsData } = useCars();
  const [carCount, setCarCount] = useState(CARS_PER_PAGE_DESKTOP);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile && carCount > CARS_PER_PAGE_MOBILE) {
      setCarCount(CARS_PER_PAGE_MOBILE);
    }
    if (!isMobile && carCount < CARS_PER_PAGE_DESKTOP) {
      setCarCount(CARS_PER_PAGE_DESKTOP);
    }
  }, [isMobile]);

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
      <SEO
        canonicalPath="/"
        jsonLd={[
          {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/icon.png`,
            contactPoint: phones.filter((p) => p.tel).map((p) => ({
              '@type': 'ContactPoint',
              telephone: p.tel,
              contactType: 'sales',
            })),
          },
          {
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
          },
        ]}
      />

      {/* ── Festival Banner ── */}
      {festival?.active && (
        <section className="relative overflow-hidden" style={{ backgroundColor: festival.bgColor || '#dc2626' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative py-3 md:py-4 text-center">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <h2 className="text-sm md:text-lg font-bold">{festival.title || 'فروش ویژه'}</h2>
                </div>
                {festival.subtitle && <p className="text-xs md:text-sm opacity-90">{festival.subtitle}</p>}
                {(!festival.products || festival.products.length === 0) && (
                  <Link
                    href="/products?featured=true"
                    className="bg-white text-gray-900 px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-gray-100 transition-all duration-200 active:scale-95 shadow-lg"
                  >
                    {festival.btnText || 'مشاهده محصولات'}
                  </Link>
                )}
              </div>
            </div>
          </div>
          {festival.products?.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {festival.products.map((p: { _id?: string; slug: string; name: string; images?: string[]; price: number; discountPrice?: number }, idx: number) => (
                  <Link
                    key={p._id || idx}
                    href={`/products/${p.slug}`}
                    className="bg-white/95 backdrop-blur-sm rounded-xl p-2 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group animate-fade-in"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-300 overflow-hidden group-hover:bg-gray-50 transition-colors duration-300">
                      {p.images?.[0] ? (
                        <img src={toAbsoluteUploadUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <svg className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-xs font-bold truncate text-gray-800 group-hover:text-primary transition-colors duration-200">{p.name}</h3>
                    <div className="mt-1">
                      {hidePrices ? (
                        <p className="text-xs font-bold text-primary">برای اطلاع از قیمت تماس بگیرید</p>
                      ) : p.discountPrice ? (
                        <p className="text-xs font-bold text-danger">{formatPrice(p.discountPrice)}</p>
                      ) : (
                        <p className="text-xs font-bold text-gray-800">{formatPrice(p.price)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Hero Section ── */}
      <section
        className={`relative overflow-hidden text-white ${settings?.headerImage ? '' : 'bg-gradient-to-br from-primary via-primary-dark to-blue-900'}`}
      >
        {settings?.headerImage && (
          <>
            <img src={toAbsoluteUploadUrl(settings.headerImage)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
          </>
        )}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb orb-1 animate-float" />
          <div className="orb orb-2 animate-float-delayed" />
        </div>
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 lg:py-36">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
              <div className="text-center md:text-right max-w-2xl">
                <AnimateOnScroll>
                  <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3.5 py-1.5 mb-5 border border-white/10">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-white/80">فروشگاه تخصصی قطعات یدکی خودرو</span>
                  </div>
                </AnimateOnScroll>
                <AnimateOnScroll delay={100}>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-5">
                    {settings?.heroTitle || 'فروشگاه تخصصی قطعات یدکی خودرو'}
                  </h1>
                </AnimateOnScroll>
                <AnimateOnScroll delay={200}>
                  <p className="text-base md:text-xl text-blue-200/90 max-w-xl leading-relaxed mb-8 mx-auto md:mx-0">
                    {settings?.heroSubtitle ? (
                      settings.heroSubtitle
                    ) : (
                      <>انواع <strong className="font-semibold text-white">قطعات یدکی خودرو</strong>های ایرانی و خارجی با <strong className="font-semibold text-white">بهترین کیفیت</strong> و قیمت مناسب</>
                    )}
                  </p>
                </AnimateOnScroll>
                <AnimateOnScroll delay={300}>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-2 bg-secondary text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-secondary-light hover:-translate-y-0.5 transition-all duration-200 active:scale-95 shadow-lg shadow-secondary/25"
                    >
                      مشاهده محصولات
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Link>
                    <Link
                      href="/cars"
                      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium border border-white/20 hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                    >
                      خودروها
                    </Link>
                  </div>
                </AnimateOnScroll>
              </div>
              {phones.length > 0 && (
                <AnimateOnScroll delay={200} className="flex-shrink-0 self-center">
                  <div className="glass rounded-2xl p-5 md:p-6 w-full md:w-64 text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <p className="text-xs text-blue-200 font-medium">تلفن تماس</p>
                    </div>
                    <div className="flex flex-col items-center gap-2.5">
                      {phones.map((p, i) => (
                        <a
                          key={i}
                          href={`tel:${p.tel}`}
                          dir="ltr"
                          className="inline-flex items-center justify-center gap-2 text-white font-bold text-lg hover:text-secondary transition whitespace-nowrap"
                        >
                          {p.name && <span className="text-xs font-normal text-white/60 ml-1">{p.name}:</span>}
                          {p.tel}
                        </a>
                      ))}
                    </div>
                    <p className="text-[10px] text-blue-200/60 mt-3 leading-relaxed text-center">برای اطلاع دقیق از قیمت‌های نمایندگی تماس بگیرید</p>
                  </div>
                </AnimateOnScroll>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent pointer-events-none" />
      </section>

      {/* ── Distributor Brands Section ── */}
      {settings?.distributor?.active && settings?.distributor?.brands?.length > 0 && (
        <section className="relative py-16 md:py-20 bg-mesh-light section-divider">
          <div className="max-w-7xl mx-auto px-4">
            <AnimateOnScroll>
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="inline-block text-xs font-bold text-primary/60 uppercase tracking-widest mb-3">Brands</span>
                <SectionTitle className="mb-3">{settings.distributor.title || 'نمایندگی پخش عمده هرینگتون و ویژن'}</SectionTitle>
                <p className="text-sm text-gray-500 leading-relaxed">توزیع‌کننده رسمی برندهای معتبر قطعات یدکی خودرو</p>
              </div>
            </AnimateOnScroll>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {settings.distributor.brands.map((brand: { name: string; logo?: string }, idx: number) => (
                <AnimateOnScroll key={idx} delay={idx * 150}>
                  <div className="group flex flex-col items-center gap-3">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl flex items-center justify-center p-6 shadow-sm border border-gray-100 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-primary/20 transition-all duration-300">
                      {brand.logo ? (
                        <img src={toAbsoluteUploadUrl(brand.logo)} alt={brand.name} className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110" />
                      ) : (
                        <span className="text-gray-400 text-sm font-bold text-center">{brand.name}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-600 group-hover:text-primary transition-colors duration-200">{brand.name}</span>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Car Selection Section ── */}
      <section className="relative py-16 md:py-20 bg-mesh-warm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-3 animate-float-delayed opacity-30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <span className="inline-block text-xs font-bold text-secondary/70 uppercase tracking-widest mb-3">Vehicle Selection</span>
                <SectionTitle>خودروی خود را انتخاب کنید</SectionTitle>
              </div>
              <SectionLink href="/cars">مشاهده همه خودروها</SectionLink>
            </div>
          </AnimateOnScroll>
          {allCars.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse shadow-sm">
                  <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                {allCars.slice(0, carCount).map((car, idx) => (
                  <Link
                    key={car._id}
                    href={`/products?car=${car._id}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-4 md:p-5 text-center hover:shadow-xl hover:-translate-y-1 hover:border-secondary/30 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-300 overflow-hidden group-hover:from-secondary/5 group-hover:to-secondary/10 transition-colors duration-300">
                      {car.image ? (
                        <img src={toAbsoluteUploadUrl(car.image)} alt={car.brand && car.brand !== car.model ? `${car.brand} ${car.model}` : car.model} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <CarIcon className="w-20 h-14 group-hover:scale-110 transition-transform duration-300 text-gray-300 group-hover:text-secondary/40" />
                      )}
                    </div>
                    <h3 className="text-xs md:text-sm font-bold truncate text-gray-700 group-hover:text-primary transition-colors duration-200">
                      {car.brand && car.brand !== car.model ? `${car.brand} ${car.model}` : car.model}
                    </h3>
                  </Link>
                ))}
              </div>
              {carCount < allCars.length && (
                <AnimateOnScroll>
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setCarCount((c) => c + (isMobile ? CARS_PER_PAGE_MOBILE : CARS_PER_PAGE_DESKTOP))}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark hover:-translate-y-0.5 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/25"
                    >
                      بیشتر
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </AnimateOnScroll>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Featured Products Section ── */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <span className="inline-block text-xs font-bold text-primary-light/60 uppercase tracking-widest mb-3">Featured</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">محصولات ویژه</h2>
              </div>
              <SectionLink href="/products?featured=true">مشاهده همه محصولات</SectionLink>
            </div>
          </AnimateOnScroll>
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
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent pointer-events-none" />
      </section>

      {/* ── Features Section ── */}
      <section className="relative py-16 md:py-20 bg-white section-divider">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-block text-xs font-bold text-primary/60 uppercase tracking-widest mb-3">Features</span>
              <SectionTitle className="mb-3">چرا فروشگاه ما؟</SectionTitle>
              <p className="text-sm text-gray-500 leading-relaxed">تجربه خریدی مطمئن و حرفه‌ای با ضمانت اصالت کالا</p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
                title: 'ارسال سریع',
                desc: 'ارسال به سراسر ایران در کوتاه‌ترین زمان ممکن با بسته‌بندی حرفه‌ای و مطمئن',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: 'ضمانت اصالت کالا',
                desc: 'تمامی محصولات با ضمانت اصالت فیزیکی و گارانتی بازگشت کالا عرضه می‌شوند',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                ),
                title: 'پرداخت آنلاین',
                desc: 'پرداخت امن و سریع از طریق درگاه زرین‌پال با ضمانت بازگشت وجه',
              },
            ].map((item, idx) => (
              <AnimateOnScroll key={idx} delay={idx * 100}>
                <div className="group relative bg-white border border-gray-100 rounded-2xl p-4 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary mb-4 md:mb-5 group-hover:from-primary group-hover:to-primary-dark group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/25">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
