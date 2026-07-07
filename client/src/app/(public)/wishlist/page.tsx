'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getFavorites } from '@/services/orderService';
import ProductCard from '@/components/product/ProductCard';
import SEO from '@/components/common/SEO';
import type { IProduct } from '@/types';

const Wishlist = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
  });

  const products: IProduct[] = data?.products || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEO title="علاقه‌مندی‌ها" />
      <h1 className="text-2xl font-bold mb-6">علاقه‌مندی‌ها</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <ProductCard.Shimmer key={i} idx={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🤍</p>
          <p className="text-lg">لیست علاقه‌مندی‌ها خالی است</p>
          <Link href="/products" className="text-primary hover:underline mt-2 inline-block">مشاهده محصولات</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, idx) => (
            <ProductCard key={product._id} product={product} idx={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
