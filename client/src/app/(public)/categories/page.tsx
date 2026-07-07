'use client';

import Link from 'next/link';
import { useCategories } from '@/lib/hooks/useProducts';
import { toPersianNumber } from '@/lib/utils/numbers';
import SEO from '@/components/common/SEO';

const getIcon = (cat: { icon?: string; name: string }) => {
  if (cat.icon?.startsWith('/uploads/')) {
    return <img src={cat.icon} alt="" className="w-12 h-12 mx-auto object-contain group-hover:scale-110 transition-transform duration-300" />;
  }
  return <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{cat.icon || '📦'}</span>;
};

const Categories = () => {
  const { data: categoriesData, isLoading } = useCategories();
  const categories = categoriesData?.categories || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEO title="دسته‌بندی‌ها" description="دسته‌بندی محصولات فروشگاه قطعات یدکی خودرو" />
      <h1 className="text-2xl font-bold mb-6">دسته‌بندی محصولات</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 shimmer rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat: { _id: string; icon?: string; name: string; productCount?: number }, idx: number) => (
            <Link
              key={cat._id}
              href={`/products?category=${cat._id}`}
              className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] hover:border-primary transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="mb-3 flex justify-center">{getIcon(cat)}</div>
              <h2 className="font-bold text-lg group-hover:text-primary transition-colors duration-200">{cat.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {toPersianNumber(cat.productCount || 0)} محصول
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
