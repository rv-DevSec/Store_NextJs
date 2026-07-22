'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { updateOrderPaymentInfo } from '@/services/orderService';
import { formatPrice, toPersianNumber, formatDateTime } from '@/lib/utils/numbers';

const statusLabel: Record<string, string> = {
  in_progress: 'در حال پردازش', calling: 'در حال تماس', called: 'تماس گرفته شد',
  accept: 'تایید شده', sent: 'ارسال شده', cancelled: 'لغو شده',
};

const statusColor: Record<string, string> = {
  in_progress: 'bg-warning/10 text-warning', calling: 'bg-blue-50 text-blue-700',
  called: 'bg-info/10 text-info', accept: 'bg-primary/10 text-primary',
  sent: 'bg-success/10 text-success', cancelled: 'bg-danger/10 text-danger',
};

const SellerOrderDetail = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-order', id],
    queryFn: async () => {
      const { data: res } = await api.get(`/seller/orders/${id}`);
      return res;
    },
  });

  const order = data?.order;

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!receiptFile) throw new Error('no file');
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      return updateOrderPaymentInfo(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-order', id] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      setReceiptFile(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 shimmer rounded-xl" />)}</div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">سفارش مورد نظر یافت نشد</p>
        <button onClick={() => router.push('/seller/orders')} className="text-primary hover:underline mt-2 inline-block">بازگشت به سفارشات</button>
      </div>
    );
  }

  const receiptImage = order.paymentInfo?.receiptImage;
  const canUploadReceipt = order.paymentStatus === 'pending';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/seller/orders')} className="text-gray-400 hover:text-gray-600 transition p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">جزئیات سفارش</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">کد سفارش: </span><span dir="ltr" className="font-medium">{id.slice(-8).toUpperCase()}</span></div>
            <div><span className="text-gray-500">تاریخ: </span>{formatDateTime(order.createdAt)}</div>
            <div>
              <span className="text-gray-500">وضعیت: </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.sellerStatus || 'in_progress'] || ''}`}>
                {statusLabel[order.sellerStatus || 'in_progress'] || order.sellerStatus}
              </span>
            </div>
            <div>
              <span className="text-gray-500">پرداخت: </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                order.paymentStatus === 'paid' ? 'bg-success/10 text-success' :
                order.paymentStatus === 'failed' ? 'bg-danger/10 text-danger' :
                'bg-warning/10 text-warning'
              }`}>
                {order.paymentStatus === 'paid' ? 'پرداخت شده' :
                 order.paymentStatus === 'failed' ? 'ناموفق' : 'در انتظار'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">مبلغ کل: </span>
              <span className="font-bold">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
          {order.sellerNote && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-gray-500 text-sm">یادداشت: </span>
              <span className="text-sm">{order.sellerNote}</span>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-bold mb-3">محصولات ({toPersianNumber(order.items.length)})</h2>
          <div className="space-y-2">
            {order.items.map((item: { image?: string; name: string; price: number; qty: number }, idx: number) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                {item.image && (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatPrice(item.price)} × {toPersianNumber(item.qty)}</p>
                </div>
                <p className="text-sm font-bold">{formatPrice(item.price * item.qty)}</p>
              </div>
            ))}
          </div>
        </div>

        {canUploadReceipt && (
          <div className="bg-white border border-blue-200 rounded-xl p-4">
            <h3 className="font-bold mb-3 text-blue-800">آپلود رسید پرداخت</h3>
            <p className="text-sm text-gray-600 mb-2">تصویر رسید واریز را آپلود کنید:</p>
            <input type="file" accept="image/jpeg,image/png" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="w-full text-sm file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition" />
            {receiptFile && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">{receiptFile.name}</span>
                <button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}
                  className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition disabled:opacity-50">
                  {uploadMutation.isPending ? 'در حال آپلود...' : 'آپلود رسید'}
                </button>
              </div>
            )}
            {uploadMutation.isSuccess && <p className="text-xs text-success mt-2">رسید با موفقیت آپلود شد.</p>}
            {uploadMutation.isError && <p className="text-xs text-danger mt-2">خطا در آپلود رسید. لطفاً مجدداً تلاش کنید.</p>}
          </div>
        )}

        {receiptImage && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-bold mb-3">رسید پرداخت</h3>
            <a href={receiptImage} target="_blank" rel="noopener noreferrer">
              <img src={receiptImage} alt="رسید پرداخت" className="max-h-64 rounded-lg border border-gray-200" />
            </a>
            <p className="text-xs text-gray-500 mt-2">
              {order.paymentStatus === 'paid' ? '✅ تأیید شده' : '⏳ در انتظار تأیید مدیر'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrderDetail;
