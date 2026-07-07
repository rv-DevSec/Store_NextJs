'use client';

import { useQuery } from '@tanstack/react-query';
import { formatPrice, formatDateTime, toPersianNumber } from '@/lib/utils/numbers';
import api from '@/lib/api';

const statusMap: Record<string, string> = {
  in_progress: 'در حال پردازش', calling: 'در حال تماس', called: 'تماس گرفته شد', accept: 'تایید شده', sent: 'ارسال شده', cancelled: 'لغو شده',
};

const SellerOrders = () => {
  const { data } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: async () => {
      const { data: res } = await api.get('/seller/orders');
      return res;
    },
  });

  const orders = data?.orders || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">سفارشات من</h1>

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order: { _id: string; items?: Array<{ name: string; qty: number; price: number }>; totalAmount: number; status: string; sellerStatus?: string; createdAt: string }) => (
          <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded-lg text-xs ${
                order.sellerStatus === 'sent' ? 'bg-success/10 text-success' :
                order.sellerStatus === 'cancelled' ? 'bg-danger/10 text-danger' :
                order.sellerStatus === 'accept' ? 'bg-primary/10 text-primary' :
                'bg-warning/10 text-warning'
              }`}>
                {statusMap[order.sellerStatus || 'in_progress'] || order.sellerStatus}
              </span>
            </div>
            <div className="space-y-1 mb-2">
              {order.items?.map((item, i) => (
                <p key={i} className="text-xs text-gray-600">{item.name} × {toPersianNumber(item.qty)} - {formatPrice(item.price * item.qty)}</p>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-bold text-gray-700">{formatPrice(order.totalAmount)}</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-center py-8 text-gray-500">سفارشی وجود ندارد</p>}
      </div>
    </div>
  );
};

export default SellerOrders;
