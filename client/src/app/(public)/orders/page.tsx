'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getOrders } from '@/services/orderService';
import { formatPrice, toPersianNumber, formatDate } from '@/lib/utils/numbers';
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

const Orders = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  const orders: IOrder[] = data?.orders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEO title="سفارشات من" />
      <h1 className="text-2xl font-bold mb-6">سفارشات من</h1>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 shimmer rounded-xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-lg">هنوز سفارشی ثبت نکرده‌اید</p>
          <Link href="/products" className="text-primary hover:underline mt-2 inline-block">مشاهده محصولات</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isSellerOrder = order.type === 'seller';
            const statusKey = isSellerOrder ? (order.sellerStatus || 'in_progress') : order.status;
            const colors = isSellerOrder ? sellerStatusColors : statusColors;
            const labels = isSellerOrder ? sellerStatusLabels : statusLabels;
            return (
            <Link key={order._id} href={`/orders/${order._id}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[statusKey] || ''}`}>
                  {labels[statusKey] || statusKey}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{toPersianNumber(order.items.length)} کالا</p>
                  <p className="font-bold mt-1">{formatPrice(order.totalAmount)}</p>
                </div>
                {order.trackingCode && (
                  <span className="text-xs text-gray-400">کد رهگیری: {order.trackingCode}</span>
                )}
              </div>
            </Link>
          )})}
        </div>
      )}
    </div>
  );
};

export default Orders;
