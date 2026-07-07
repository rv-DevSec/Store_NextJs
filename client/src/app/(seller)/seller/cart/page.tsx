'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice, toPersianNumber } from '@/lib/utils/numbers';
import api from '@/lib/api';
import Link from 'next/link';

const SellerCart = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('productId') || '';

  const [orderItems, setOrderItems] = useState<Array<{ productId: string; qty: number }>>(
    preselectedId ? [{ productId: preselectedId, qty: 1 }] : []
  );
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState('');

  const { data: productsData } = useQuery({
    queryKey: ['seller-products-all'],
    queryFn: async () => {
      const { data: res } = await api.get('/seller/products', { params: { limit: 200 } });
      return res;
    },
  });

  const products = productsData?.products || [];

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.post('/seller/orders', { items: orderItems, note });
      return res;
    },
    onSuccess: () => {
      setSuccess('سفارش با موفقیت ثبت شد');
      setOrderItems([]);
      setNote('');
      setTimeout(() => router.push('/seller/orders'), 2000);
    },
  });

  const addItem = () => setOrderItems((prev) => [...prev, { productId: '', qty: 1 }]);
  const updateItem = (idx: number, field: 'productId' | 'qty', value: string | number) => {
    setOrderItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const removeItem = (idx: number) => setOrderItems((prev) => prev.filter((_, i) => i !== idx));

  const totalAmount = orderItems.reduce((sum, item) => {
    const product = products.find((p: { _id: string }) => p._id === item.productId);
    return sum + (product ? product.sellerPrice * item.qty : 0);
  }, 0);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ثبت سفارش</h1>
        <Link href="/seller/products" className="text-sm text-primary font-medium hover:underline">بازگشت به محصولات</Link>
      </div>

      {success && (
        <div className="bg-success/10 text-success text-sm p-4 rounded-xl mb-4 animate-fade-in">{success}</div>
      )}

      {placeOrderMutation.isError && (
        <div className="bg-danger/10 text-danger text-sm p-4 rounded-xl mb-4 animate-fade-in">
          {(placeOrderMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ثبت سفارش'}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {orderItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <select value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
              <option value="">انتخاب محصول</option>
              {products.map((p: { _id: string; name: string; sellerPrice: number }) => (
                <option key={p._id} value={p._id}>{p.name} — {formatPrice(p.sellerPrice)}</option>
              ))}
            </select>
            <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(idx, 'qty', Math.max(1, Number(e.target.value)))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary text-center" />
            <button onClick={() => removeItem(idx)}
              className="text-xs px-2 py-1.5 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
          </div>
        ))}

        <button onClick={addItem}
          className="text-sm text-primary font-medium hover:underline">+ افزودن محصول</button>

        <div>
          <label className="block text-xs text-gray-500 mb-1">یادداشت</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="font-bold text-lg">جمع کل: {formatPrice(totalAmount)}</span>
          <button onClick={() => placeOrderMutation.mutate()} disabled={orderItems.length === 0 || orderItems.some((i) => !i.productId) || placeOrderMutation.isPending}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition disabled:opacity-50 shadow-lg shadow-primary/25">
            {placeOrderMutation.isPending ? 'در حال ثبت...' : 'ثبت سفارش'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerCart;
