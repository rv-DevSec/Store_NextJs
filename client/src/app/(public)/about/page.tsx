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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <SEO title="درباره ما" description="اطلاعات تماس و توضیحات فروشگاه قطعات یدکی خودرو" />
      <h1 className="text-2xl font-bold">درباره ما</h1>

      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
        {s.about || 'هنوز توضیحاتی ثبت نشده است.'}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold">اطلاعات تماس</h2>
        <div className="space-y-3 text-sm">
          {s.phone && (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 min-w-[60px]">تلفن:</span>
              <span dir="ltr" className="text-gray-800">{s.phone as string}</span>
            </div>
          )}
          {s.email && (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 min-w-[60px]">ایمیل:</span>
              <span className="text-gray-800 direction-ltr">{s.email as string}</span>
            </div>
          )}
          {s.address && (
            <div className="flex items-start gap-3">
              <span className="text-gray-500 min-w-[60px]">آدرس:</span>
              <span className="text-gray-800">{s.address as string}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
