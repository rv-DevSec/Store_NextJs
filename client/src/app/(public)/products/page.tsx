'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts, useCategories, useCars } from '@/lib/hooks/useProducts';
import { toPersianNumber } from '@/lib/utils/numbers';
import ProductCard from '@/components/product/ProductCard';
import SEO from '@/components/common/SEO';
import type { IProduct, ICategory } from '@/types';

const sortOptions = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
  { value: 'popular', label: 'محبوب‌ترین' },
];

const ProductsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get('search') || '';
  const rawCategory = searchParams.get('category') || '';
  const car = searchParams.get('car') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = searchParams.get('page') || '1';

  const [localSearch, setLocalSearch] = useState(search);
  const [userBrand, setUserBrand] = useState('');

  const { data: categoriesData } = useCategories();
  const { data: carsData } = useCars();

  const categories: ICategory[] = categoriesData?.categories || [];

  const category = useMemo(() => {
    if (!rawCategory) return '';
    if (categories.find((c) => c._id === rawCategory)) return rawCategory;
    const bySlug = categories.find((c) => c.slug === rawCategory);
    return bySlug ? bySlug._id : rawCategory;
  }, [rawCategory, categories]);

  const { data: productsData, isLoading } = useProducts({
    search, category, car, minPrice, maxPrice, sort, page, limit: 12,
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || { total: 0, page: 1, pages: 1 };
  const brands = carsData?.brands as { brand: string; models: { _id: string; model: string }[] }[] | undefined;

  const derivedBrand = useMemo(() => {
    if (car && brands) {
      const found = brands.find((b) => b.models.some((m) => m._id === car));
      return found?.brand || '';
    }
    return '';
  }, [car, brands]);

  const effectiveBrand = car ? derivedBrand : userBrand;
  const modelsForBrand = brands?.find((b) => b.brand === effectiveBrand)?.models || [];

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) { params.set(key, value); }
      else { params.delete(key); }
    });
    if (updates.category !== undefined || updates.car !== undefined ||
        updates.minPrice !== undefined || updates.maxPrice !== undefined ||
        updates.search !== undefined) {
      params.delete('page');
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: localSearch });
  };

  const handleBrandChange = (brand: string) => {
    setUserBrand(brand);
    updateParams({ car: '' });
  };

  const handleModelChange = (modelId: string) => {
    updateParams({ car: modelId });
  };

  const clearFilters = () => {
    setLocalSearch('');
    setUserBrand('');
    router.push('/products');
  };

  const hasFilters = !!(search || category || car || minPrice || maxPrice);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <SEO title="محصولات" description="لیست محصولات فروشگاه قطعات یدکی خودرو" />
        <h1 className="text-2xl font-bold">محصولات</h1>
        {search && <p className="text-gray-500 mt-1">نتایج جستجو برای &quot;{search}&quot;</p>}
        {pagination.total > 0 && (
          <p className="text-sm text-gray-400 mt-1">{toPersianNumber(pagination.total)} محصول</p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-20">
            <h3 className="font-bold mb-3">فیلترها</h3>

            <form onSubmit={handleSearch} className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">جستجو</label>
              <input type="text" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="نام محصول..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </form>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">دسته‌بندی</label>
              <select value={category} onChange={(e) => updateParams({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="">همه دسته‌ها</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">برند خودرو</label>
              <select value={effectiveBrand} onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="">همه برندها</option>
                {(brands || []).map((b) => (
                  <option key={b.brand} value={b.brand}>{b.brand}</option>
                ))}
              </select>
            </div>

            {effectiveBrand && (
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">مدل خودرو</label>
                <select value={car} onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
                  <option value="">همه مدل‌ها</option>
                  {modelsForBrand.map((m) => (
                    <option key={m._id} value={m._id}>{m.model}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">محدوده قیمت</label>
              <div className="flex gap-2">
                <input type="number" placeholder="از" value={minPrice}
                  onChange={(e) => updateParams({ minPrice: e.target.value })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="تا" value={maxPrice}
                  onChange={(e) => updateParams({ maxPrice: e.target.value })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            {hasFilters && (
              <button onClick={clearFilters}
                className="w-full text-sm text-danger hover:underline">
                حذف همه فیلترها
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {categories.filter((c) => c._id === category).map((c) => (
                <span key={c._id} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">{c.name}</span>
              ))}
            </div>
            <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <ProductCard.Shimmer key={i} idx={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📦</p>
              <p>محصولی یافت نشد</p>
              <button onClick={clearFilters}
                className="text-primary hover:underline mt-2 inline-block">حذف فیلترها</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product: IProduct, idx: number) => (
                  <ProductCard key={product._id} product={product} idx={idx} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button onClick={() => updateParams({ page: String(Number(page) - 1) })}
                    disabled={Number(page) <= 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">قبلی</button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - Number(page)) <= 2 || p === 1 || p === pagination.pages)
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
                        <button onClick={() => updateParams({ page: String(p) })}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition ${Number(page) === p ? 'bg-primary text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                          {toPersianNumber(p)}
                        </button>
                      </span>
                    ))}
                  <button onClick={() => updateParams({ page: String(Number(page) + 1) })}
                    disabled={Number(page) >= pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">بعدی</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductsPage = () => {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <ProductCard.Shimmer key={i} idx={i} />)}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
};

export default ProductsPage;
