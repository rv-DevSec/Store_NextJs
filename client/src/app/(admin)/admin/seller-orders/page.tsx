'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminSellerOrders, updateSellerOrderStatus, adminDeleteSellerOrder, updateOrderStatus } from '@/services/orderService';
import { formatPrice, formatDateTime, toPersianNumber } from '@/lib/utils/numbers';

const sellerStatuses = ['in_progress', 'calling', 'called', 'accept', 'sent', 'cancelled'] as const;

const statusLabel: Record<string, string> = {
  in_progress: 'در حال پردازش', calling: 'در حال تماس', called: 'تماس گرفته شد', accept: 'تایید شده', sent: 'ارسال شده', cancelled: 'لغو شده',
};

const statusColors: Record<string, string> = {
  in_progress: 'bg-warning/10 text-warning border-warning/30',
  calling: 'bg-blue-50 text-blue-700 border-blue-200',
  called: 'bg-info/10 text-info border-info/30',
  accept: 'bg-primary/10 text-primary border-primary/30',
  sent: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-danger/10 text-danger border-danger/30',
};

const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'] as const;

const paymentStatusLabel: Record<string, string> = {
  pending: 'در انتظار', paid: 'پرداخت شده', failed: 'ناموفق', refunded: 'مسترد شده',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  paid: 'bg-success/10 text-success border-success/30',
  failed: 'bg-danger/10 text-danger border-danger/30',
  refunded: 'bg-info/10 text-info border-info/30',
};

const AdminSellerOrders = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const queryKey = ['admin-seller-orders', page, search];

  const { data } = useQuery({
    queryKey,
    queryFn: () => getAdminSellerOrders({
      page: String(page), limit: '20',
      ...(search && { search }),
    }),
  });

  const orders = data?.orders || [];
  const totalPages = data?.pagination?.pages || 1;

  const updateMutation = useMutation({
    mutationFn: ({ id, sellerStatus }: { id: string; sellerStatus: string }) =>
      updateSellerOrderStatus(id, sellerStatus),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
      updateOrderStatus(id, undefined, undefined, paymentStatus),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteSellerOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">سفارش فروشندگان</h1>

      <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="جستجو بر اساس نام فروشنده..."
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-xl text-sm mb-4 focus:outline-none focus:border-primary" />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-medium">کد سفارش</th>
                <th className="text-right px-4 py-3 font-medium">فروشنده</th>
                <th className="text-right px-4 py-3 font-medium">محصولات</th>
                <th className="text-right px-4 py-3 font-medium">مبلغ</th>
                <th className="text-right px-4 py-3 font-medium">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium">پرداخت</th>
                <th className="text-right px-4 py-3 font-medium">تاریخ</th>
                <th className="text-right px-4 py-3 font-medium">یادداشت</th>
                <th className="text-left px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: { _id: string; user?: { name: string; username?: string }; items?: Array<{ name: string; qty: number; price: number }>; totalAmount: number; sellerStatus?: string; paymentStatus?: string; paymentInfo?: { receiptImage?: string; transactionId?: string }; sellerNote?: string; createdAt: string }) => (
                <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-xs font-mono" dir="ltr">{order._id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3 font-medium">{order.user?.name || order.user?.username || 'فروشنده'}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {order.items?.map((item, i) => (
                        <p key={i}>{item.name} × {toPersianNumber(item.qty)} - {formatPrice(item.price * item.qty)}</p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <select value={order.sellerStatus || 'in_progress'} onChange={(e) =>
                      updateMutation.mutate({ id: order._id, sellerStatus: e.target.value })}
                      className={`px-2 py-1 border rounded text-xs font-medium ${statusColors[order.sellerStatus || 'in_progress']}`}>
                      {sellerStatuses.map((key) => (
                        <option key={key} value={key} className="text-gray-800 bg-white">{statusLabel[key]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <select value={order.paymentStatus || 'pending'} onChange={(e) =>
                        paymentMutation.mutate({ id: order._id, paymentStatus: e.target.value })}
                        className={`px-2 py-1 border rounded text-xs font-medium ${paymentStatusColors[order.paymentStatus || 'pending']}`}>
                        {paymentStatuses.map((key) => (
                          <option key={key} value={key} className="text-gray-800 bg-white">{paymentStatusLabel[key]}</option>
                        ))}
                      </select>
                      {order.paymentInfo?.receiptImage && (
                        <a href={order.paymentInfo.receiptImage} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline">مشاهده رسید</a>
                      )}
                      {order.paymentInfo?.transactionId && (
                        <span className="text-xs text-gray-500" dir="ltr">کد: {order.paymentInfo.transactionId}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">{order.sellerNote || '—'}</td>
                  <td className="px-4 py-3 text-left">
                    <button onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(order._id); }}
                      className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">سفارشی یافت نشد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition">قبلی</button>
          <span className="px-3 py-1.5 text-sm">{toPersianNumber(page)} از {toPersianNumber(totalPages)}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition">بعدی</button>
        </div>
      )}
    </div>
  );
};

export default AdminSellerOrders;
