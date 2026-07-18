'use client';

import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatPrice, toPersianNumber } from '@/lib/utils/numbers';
import api from '@/lib/api';
import Link from 'next/link';

interface CartItem {
  productId: string;
  name: string;
  sellerPrice: number;
  qty: number;
}

const SellerProducts = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState('');
  const [addedFeedback, setAddedFeedback] = useState<Record<string, boolean>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['seller-products', search],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: '20' });
      if (search) params.set('search', search);
      const { data: res } = await api.get(`/seller/products?${params}`);
      return res;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const products = data?.pages.flatMap((page) => page.products) || [];

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.post('/seller/orders', {
        items: cart.map(({ productId, qty }) => ({ productId, qty })),
        note,
      });
      return res;
    },
    onSuccess: () => {
      setSuccess('سفارش با موفقیت ثبت شد');
      setCart([]);
      setQuantities({});
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const addToCart = (product: { _id: string; name: string; sellerPrice: number; stock: number }) => {
    const qty = quantities[product._id] || 1;
    if (qty < 1) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { productId: product._id, name: product.name, sellerPrice: product.sellerPrice, qty }];
    });
    setQuantities((prev) => ({ ...prev, [product._id]: 1 }));
    setAddedFeedback((prev) => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAddedFeedback((prev) => ({ ...prev, [product._id]: false })), 200);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, qty } : item))
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.sellerPrice * item.qty, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">محصولات</h1>
        <Link href="/seller/orders" className="text-sm text-primary font-medium hover:underline">سفارشات من</Link>
      </div>

      {success && (
        <div className="bg-success/10 text-success text-sm p-4 rounded-xl mb-4 animate-fade-in">{success}</div>
      )}

      {placeOrderMutation.isError && (
        <div className="bg-danger/10 text-danger text-sm p-4 rounded-xl mb-4 animate-fade-in">
          {(placeOrderMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ثبت سفارش'}
        </div>
      )}

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="جستجوی محصول..."
        className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-xl text-sm mb-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" />

      <div className="lg:flex lg:gap-6 lg:items-start">
        <div className="lg:flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-medium">محصول</th>
                <th className="text-right px-4 py-3 font-medium">قیمت فروشنده</th>
                <th className="text-right px-4 py-3 font-medium">موجودی</th>
                <th className="text-center px-4 py-3 font-medium">تعداد</th>
                <th className="text-center px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: { _id: string; name: string; sellerPrice: number; stock: number; images?: string[] }) => (
                <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="font-medium truncate max-w-[160px] sm:max-w-[250px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">{formatPrice(product.sellerPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs whitespace-nowrap ${product.stock > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {product.stock > 0 ? toPersianNumber(product.stock) + ' عدد' : 'ناموجود'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min={1} max={product.stock} value={quantities[product._id] || 1}
                      onChange={(e) => setQuantities((prev) => ({ ...prev, [product._id]: Math.max(1, Number(e.target.value)) }))}
                      className="w-14 sm:w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => addToCart(product)} disabled={product.stock === 0}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 whitespace-nowrap ${addedFeedback[product._id] ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                      {addedFeedback[product._id] ? 'افزوده شد' : 'افزودن'}
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && products.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">محصولی یافت نشد</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {isFetchingNextPage && (
          <div className="text-center py-4 text-gray-400 text-sm">در حال بارگذاری...</div>
        )}

        <div ref={sentinelRef} className="h-4" />
      </div>

        {cart.length > 0 && (
          <div className="mt-6 lg:mt-0 lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-0 lg:self-start">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-lg">
              <h3 className="font-bold mb-3">سبد سفارش ({toPersianNumber(cart.length)} کالا)</h3>
              <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[180px]">{item.name}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input type="number" min={1} value={item.qty}
                        onChange={(e) => updateCartQty(item.productId, Math.max(1, Number(e.target.value)))}
                        className="w-12 px-1 py-1 border border-gray-300 rounded text-xs text-center" />
                      <span className="text-gray-500 w-16 text-left text-xs">{formatPrice(item.sellerPrice * item.qty)}</span>
                      <button onClick={() => removeFromCart(item.productId)}
                        className="text-xs text-danger hover:underline">حذف</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="یادداشت سفارش..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-lg">جمع کل: {formatPrice(totalAmount)}</span>
                <button onClick={() => placeOrderMutation.mutate()} disabled={placeOrderMutation.isPending}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition disabled:opacity-50 shadow-lg shadow-primary/25">
                  {placeOrderMutation.isPending ? 'در حال ثبت...' : 'ثبت سفارش نهایی'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;
