'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatPrice, toPersianNumber } from '@/lib/utils/numbers';
import { getFavorites } from '@/services/orderService';
import FavoriteButton from '@/components/common/FavoriteButton';
import type { IProduct } from '@/types';

interface Props {
  product: IProduct;
  idx?: number;
}

const ProductCard = ({ product, idx = 0 }: Props) => {
  const { data: favData } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
  });
  const favSet = new Set((favData?.products || []).map((p: IProduct) => p._id));

  return (
    <Link
      key={product._id}
      href={`/products/${product.slug}`}
      className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group animate-fade-in"
      style={{ animationDelay: `${idx * 60}ms` }}
    >
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-300 overflow-hidden group-hover:bg-gray-50 transition-colors duration-300 relative">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <svg className="w-12 h-12 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )}
        <FavoriteButton productId={product._id} isFavorited={favSet.has(product._id)} className="absolute top-2 right-2" />
      </div>
      <p className="text-xs text-gray-500 mb-1 group-hover:text-primary transition-colors duration-200">
        {typeof product.category === 'object' && product.category !== null ? (product.category as { name: string }).name : ''}
      </p>
      <h3 className="text-sm font-bold group-hover:text-primary transition-colors duration-200 line-clamp-2">
        {product.name}
      </h3>
      <div className="mt-2 flex items-baseline gap-2">
        {product.discountPrice ? (
          <>
            <p className="text-sm font-bold text-danger">{formatPrice(product.discountPrice)}</p>
            <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
          </>
        ) : (
          <p className="text-sm font-bold">{formatPrice(product.price)}</p>
        )}
      </div>
      {product.stock <= 5 && product.stock > 0 && (
        <p className="text-xs text-warning mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
          تنها {toPersianNumber(product.stock)} عدد باقی‌مانده
        </p>
      )}
      {product.stock === 0 && (
        <p className="text-xs text-danger mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-danger rounded-full" />
          ناموجود
        </p>
      )}
    </Link>
  );
};

const ShimmerCard = ({ idx = 0 }: { idx?: number }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-3 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
    <div className="aspect-square shimmer rounded-lg mb-3" />
    <div className="h-4 shimmer rounded w-3/4 mb-2" />
    <div className="h-4 shimmer rounded w-1/2" />
  </div>
);

ProductCard.Shimmer = ShimmerCard;

export default ProductCard;
