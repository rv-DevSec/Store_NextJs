'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById, downloadInvoice } from '@/services/orderService';
import { formatPrice, toPersianNumber, formatDateTime } from '@/lib/utils/numbers';
import SEO from '@/components/common/SEO';
import type { IOrder } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

const statusLabels: Record<string, string> = {
  pending: 'در انتظار',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
};

const sellerStatusColors: Record<string, string> = {
  in_progress: 'bg-warning/10 text-warning',
  calling: 'bg-blue-50 text-blue-700',
  called: 'bg-info/10 text-info',
  accept: 'bg-primary/10 text-primary',
  sent: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

const sellerStatusLabels: Record<string, string> = {
  in_progress: 'در حال پردازش',
  calling: 'در حال تماس',
  called: 'تماس گرفته شد',
  accept: 'تایید شده',
  sent: 'ارسال شده',
  cancelled: 'لغو شده',
};

const paymentLabels: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  failed: 'ناموفق',
  refunded: 'برگشت داده شده',
};

const OrderDetail = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
  });

  const order: IOrder | undefined = data?.order;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 shimmer rounded-xl" />)}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-lg">سفارش مورد نظر یافت نشد</p>
        <button onClick={() => router.push('/orders')} className="text-primary hover:underline mt-2 inline-block">
          بازگشت به سفارشات
        </button>
      </div>
    );
  }

  const isSellerOrder = order.type === 'seller';
  const statusKey = isSellerOrder ? (order.sellerStatus || 'in_progress') : order.status;
  const statCol = isSellerOrder ? sellerStatusColors : statusColors;
  const statLbl = isSellerOrder ? sellerStatusLabels : statusLabels;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SEO title={`سفارش ${id.slice(-8)}`} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">جزئیات سفارش</h1>
        <button onClick={() => downloadInvoice(id)}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition">
          دانلود فاکتور
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">کد سفارش</span>
          <span className="font-medium text-sm" dir="ltr">{id.slice(-8).toUpperCase()}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">تاریخ ثبت</span>
          <span className="text-sm">{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">وضعیت</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statCol[statusKey] || ''}`}>
            {statLbl[statusKey] || statusKey}
          </span>
        </div>
        {!isSellerOrder && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">پرداخت</span>
            <span className="text-sm">{paymentLabels[order.paymentStatus] || order.paymentStatus}</span>
          </div>
        )}
        {order.trackingCode && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">کد رهگیری</span>
            <span className="text-sm font-medium">{order.trackingCode}</span>
          </div>
        )}
        {isSellerOrder && order.sellerNote && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">یادداشت فروشنده</span>
            <span className="text-sm">{order.sellerNote}</span>
          </div>
        )}
      </div>

      {!isSellerOrder && order.shippingAddress && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="font-bold mb-3">آدرس تحویل</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{order.shippingAddress.fullName} - {order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.province}، {order.shippingAddress.city}</p>
            <p>{order.shippingAddress.fullAddress}</p>
            <p>کد پستی: {order.shippingAddress.postalCode}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h3 className="font-bold mb-3">محصولات ({toPersianNumber(order.items.length)})</h3>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              {item.image && (
                <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">مبلغ کل</span>
            <span>{formatPrice(order.totalAmount + order.discountAmount - order.shippingCost)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">تخفیف</span>
              <span className="text-danger">{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          {order.shippingCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">هزینه ارسال</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
            <span>قابل پرداخت</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
