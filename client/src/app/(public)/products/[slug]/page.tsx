'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProduct, useProducts } from '@/lib/hooks/useProducts';
import { useCart } from '@/providers/CartProvider';
import { formatPrice, toPersianNumber } from '@/lib/utils/numbers';
import SEO from '@/components/common/SEO';
import { getFavorites } from '@/services/orderService';
import { getProductReviews, createReview } from '@/services/reviewService';
import FavoriteButton from '@/components/common/FavoriteButton';
import ProductCard from '@/components/product/ProductCard';
import type { IProduct, IReview, ICategory, ICar } from '@/types';

interface PopulatedProduct extends Omit<IProduct, 'category' | 'compatibleCars'> {
  category: ICategory;
  compatibleCars: ICar[];
}

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-toast-in">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${
        type === 'success' ? 'bg-success' : 'bg-danger'
      }`}>
        {type === 'success' ? (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

const StarRating = ({ rating, interactive, onChange, size }: { rating: number; interactive?: boolean; onChange?: (r: number) => void; size?: string }) => {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];
  const s = size || 'w-5 h-5';

  if (interactive) {
    return (
      <div className="flex items-center gap-0.5 flex-row-reverse" dir="ltr">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`${s} transition-all duration-150 ${
              star <= (hover || rating) ? 'text-amber-400' : 'text-gray-300'
            } hover:scale-110`}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full" fill={star <= (hover || rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {stars.map((star) => (
        <span key={star} className={`${s} ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}>
          <svg viewBox="0 0 24 24" className="w-full h-full" fill={star <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
      ))}
    </div>
  );
};

const ProductDetail = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { data, isLoading } = useProduct(slug);
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const product = data?.product as PopulatedProduct | undefined;

  const categoryId = product?.category?._id || '';
  const { data: relatedData } = useProducts(
    categoryId ? { category: categoryId, limit: '6' } : {}
  );

  const relatedProducts: IProduct[] = (relatedData?.products || []).filter(
    (p: IProduct) => p._id !== product?._id
  ).slice(0, 6);

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['product-reviews', product?._id],
    queryFn: () => getProductReviews(product!._id),
    enabled: !!product?._id,
  });

  const reviews = reviewsData?.reviews || [];

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const reviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product!._id] });
      setReviewRating(0);
      setReviewComment('');
      setShowReviewForm(false);
      setToast({ message: 'نظر شما با موفقیت ثبت شد و پس از تأیید مدیر نمایش داده خواهد شد', type: 'success' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setToast({ message: err.response?.data?.message || 'خطا در ثبت نظر', type: 'error' });
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating) {
      setToast({ message: 'لطفاً امتیاز را انتخاب کنید', type: 'error' });
      return;
    }
    if (!reviewComment.trim()) {
      setToast({ message: 'لطفاً نظر خود را بنویسید', type: 'error' });
      return;
    }
    reviewMutation.mutate({ product: product!._id, rating: reviewRating, comment: reviewComment });
  };

  const { data: favData } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
  });
  const favSet = new Set((favData?.products || []).map((p: IProduct) => p._id));

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product as IProduct, qty);
    setToast({ message: `${product.name} به سبد خرید اضافه شد`, type: 'success' });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-xl shimmer" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded shimmer w-3/4" />
            <div className="h-4 bg-gray-200 rounded shimmer w-1/4" />
            <div className="h-10 bg-gray-200 rounded shimmer w-1/3" />
            <div className="h-20 bg-gray-200 rounded shimmer" />
            <div className="h-12 bg-gray-200 rounded shimmer w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="text-6xl mb-4 animate-bounce-in">🔍</div>
        <p className="text-gray-400 text-lg">محصول مورد نظر یافت نشد</p>
        <button onClick={() => router.push('/products')} className="text-primary hover:underline mt-3 inline-block transition-colors duration-200">
          بازگشت به محصولات
        </button>
      </div>
    );
  }

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const images = product.images?.length > 0 ? product.images : [null];
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title={product.name} description={product.description} />
      <nav className="text-sm text-gray-500 mb-6 animate-slide-down">
        <button onClick={() => router.push('/')} className="hover:text-primary transition-colors duration-200">خانه</button>
        <span className="mx-2 text-gray-300">/</span>
        <button onClick={() => router.push('/products')} className="hover:text-primary transition-colors duration-200">محصولات</button>
        {product.category?.name && (
          <>
            <span className="mx-2 text-gray-300">/</span>
            <button
              onClick={() => router.push(`/products?category=${product.category._id}`)}
              className="hover:text-primary transition-colors duration-200"
            >
              {product.category.name}
            </button>
          </>
        )}
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-3">
          <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 overflow-hidden relative">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <svg className="w-32 h-32 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-danger text-white text-sm px-3 py-1.5 rounded-full font-bold animate-bounce-in shadow-lg">
                {toPersianNumber(discountPercent)}% تخفیف
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img: string | null, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === idx
                      ? 'border-primary scale-105 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold flex-1">{product.name}</h1>
            <FavoriteButton productId={product._id} isFavorited={favSet?.has(product._id)} className="!w-10 !h-10" />
          </div>

          {product.brand && (
            <p className="text-gray-500 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              برند: {product.brand}
            </p>
          )}

          {(product.numReviews > 0) && (
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={Math.round(product.rating)} size="w-4 h-4" />
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <span className="font-bold text-gray-700">{toPersianNumber(product.rating.toFixed(1))}</span>
                <span className="text-gray-400">(<span className="font-bold text-gray-700">{toPersianNumber(product.numReviews)}</span> نظر)</span>
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-4">
            {product.discountPrice ? (
              <>
                <span className="text-3xl font-bold text-danger">{formatPrice(product.discountPrice)}</span>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                <span className="bg-danger/10 text-danger text-sm px-2.5 py-1 rounded-full font-bold">{toPersianNumber(discountPercent)}%</span>
              </>
            ) : (
              <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            {product.stock > 0 ? (
              <span className="flex items-center gap-1.5 text-success text-sm">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                موجود در انبار
              </span>
            ) : (
              <span className="text-danger text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-danger rounded-full" />
                ناموجود
              </span>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-warning text-sm bg-warning/10 px-2 py-0.5 rounded-full">
                تنها <span className="font-bold">{toPersianNumber(product.stock)}</span> عدد باقی‌مانده
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-4 py-2.5 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100 font-medium"
              >
                -
              </button>
              <span className="px-5 py-2.5 border-x border-gray-300 font-bold min-w-[3rem] text-center">
                {toPersianNumber(qty)}
              </span>
              <button
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="px-4 py-2.5 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100 font-medium"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm active:scale-[0.98] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              افزودن به سبد خرید
            </button>
          </div>

          {product.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                توضیحات
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                مشخصات
              </h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {(Object.entries(product.specs as Record<string, string>)).map(([key, value], idx) => (
                  <div
                    key={key}
                    className={`flex px-4 py-3 text-sm ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} transition-colors duration-200 hover:bg-gray-100`}
                  >
                    <span className="w-1/3 text-gray-500 font-medium">{key}</span>
                    <span className="w-2/3 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.compatibleCars && product.compatibleCars.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                خودروهای سازگار
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.compatibleCars.map((car) => (
                  <button
                    key={car._id}
                    onClick={() => router.push(`/products?car=${car._id}`)}
                    className="bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-full hover:bg-blue-100 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    {car.brand} {car.model}
                    {car.year ? <span> (<span className="font-bold">{toPersianNumber(car.year)}</span>)</span> : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-12 border-t border-gray-200 pt-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">محصولات مرتبط</h2>
            <Link href={`/products?category=${categoryId}`} className="text-primary hover:underline text-sm">مشاهده همه</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedProducts.map((rp, idx) => (
              <ProductCard key={rp._id} product={rp} idx={idx} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 border-t border-gray-200 pt-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">نظرات کاربران</h2>
            {product.numReviews > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={Math.round(product.rating)} size="w-4 h-4" />
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <span className="font-bold text-gray-700">{toPersianNumber(product.rating.toFixed(1))}</span>
                  <span>از <span className="font-bold">۵</span></span>
                  <span className="text-gray-300 mx-0.5">|</span>
                  <span className="font-bold text-gray-700">{toPersianNumber(product.numReviews)}</span>
                  <span>نظر</span>
                </span>
              </div>
            )}
          </div>
          {isLoggedIn && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                showReviewForm
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25'
              }`}
            >
              {showReviewForm ? 'انصراف' : 'ثبت نظر'}
            </button>
          )}
        </div>

        {showReviewForm && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200 animate-slide-up">
            <h3 className="font-bold mb-4">نظر خود را ثبت کنید</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">امتیاز شما</label>
                <StarRating rating={reviewRating} interactive onChange={setReviewRating} size="w-8 h-8" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">متن نظر</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-none"
                  placeholder="نظر خود را بنویسید..."
                />
                <p className="text-xs text-gray-400 mt-1 text-left"><span className="font-bold">{toPersianNumber(reviewComment.length)}</span> / <span className="font-bold">۱٬۰۰۰</span></p>
              </div>
              <button
                type="submit"
                disabled={reviewMutation.isPending}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-50"
              >
                {reviewMutation.isPending ? 'در حال ثبت...' : 'ثبت نظر'}
              </button>
            </form>
          </div>
        )}

        {reviewsLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl shimmer" />
          ))}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">هنوز نظری ثبت نشده است</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: IReview) => (
              <div key={review._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {review.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.user?.name || 'کاربر'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString('fa-IR')}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="w-4 h-4" />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
