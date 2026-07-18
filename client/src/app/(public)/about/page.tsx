'use client';

import { useQuery } from '@tanstack/react-query';
import { getSettings } from '@/services/productService';
import SEO from '@/components/common/SEO';

const AboutPage = () => {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const s = data?.settings || {};

  const features = [
    { icon: '🚚', title: 'ارسال سریع', desc: 'ارسال به سراسر ایران در کوتاه‌ترین زمان ممکن' },
    { icon: '✅', title: 'ضمانت اصالت', desc: 'تمامی محصولات ضمانت اصالت و سلامت فیزیکی دارند' },
    { icon: '💳', title: 'پرداخت امن', desc: 'پرداخت آنلاین امن از طریق درگاه زرین‌پال' },
    { icon: '🔄', title: 'بازگشت کالا', desc: 'امکان بازگشت کالا در صورت نارضایتی' },
  ];

  const phones: string[] = Array.isArray(s.phones) ? s.phones : (s.phone ? [s.phone] : []);

  return (
    <div>
      <SEO title="درباره ما" description={((s.about as string) || '').slice(0, 160) || 'اطلاعات فروشگاه قطعات یدکی خودرو'} />

      <section className="bg-gradient-to-l from-primary to-primary-dark text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">درباره فروشگاه قطعات یدکی خودرو</h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">تخصص در تأمین قطعات یدکی خودروهای ایرانی و خارجی با بهترین کیفیت و قیمت</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-base">
            {s.about ? (s.about as string) : (
              <p className="text-gray-400">هنوز توضیحاتی ثبت نشده است.</p>
            )}
          </div>
        </div>
      </section>

      {phones.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pt-12 pb-6">
          <div className="bg-gradient-to-l from-primary to-primary-dark rounded-2xl p-8 md:p-10 text-center text-white shadow-xl">
            <h2 className="text-lg font-bold mb-6 tracking-wide opacity-90">برای مشاوره و خرید با ما تماس بگیرید</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              {phones.map((p, i) => (
                <a key={i} href={`tel:${p}`} dir="ltr"
                  className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-6 py-3 hover:bg-white/25 transition-all duration-200 hover:scale-105">
                  <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-xl md:text-2xl font-bold tracking-wider">{p}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-10">چرا ما را انتخاب می‌کنید؟</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-3">{feat.icon}</div>
              <h3 className="font-bold text-sm mb-1">{feat.title}</h3>
              <p className="text-xs text-gray-500">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {(s.email || s.address) && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">سایر اطلاعات تماس</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {s.email && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-md transition">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-sm mb-2">ایمیل</h3>
                  <p className="text-sm text-gray-600" dir="ltr">{s.email as string}</p>
                </div>
              )}
              {s.address && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-md transition">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-sm mb-2">آدرس</h3>
                  <p className="text-sm text-gray-600">{s.address as string}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AboutPage;
