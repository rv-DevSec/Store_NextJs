'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getAdminOrders, updateOrderStatus, adminDeleteOrder } from '@/services/orderService';
import { formatPrice, toPersianNumber, formatDateTime } from '@/lib/utils/numbers';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const statusLabel: Record<string, string> = {
  pending: 'در انتظار', processing: 'در حال پردازش', shipped: 'ارسال شده', delivered: 'تحویل شده', cancelled: 'لغو شده',
};

const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'] as const;

const paymentStatusLabel: Record<string, string> = {
  pending: 'در انتظار', paid: 'پرداخت شده', failed: 'ناموفق', refunded: 'مسترد شده',
};

const paymentMethodLabel: Record<string, string> = {
  zarinpal: 'زرین‌پال', cod: 'حضوری', 'card-to-card': 'کارت به کارت',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  paid: 'bg-success/10 text-success border-success/30',
  failed: 'bg-danger/10 text-danger border-danger/30',
  refunded: 'bg-info/10 text-info border-info/30',
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const [localPayment, setLocalPayment] = useState<Record<string, string>>({});

  const queryKey = ['admin-orders', page, statusFilter, search];

  const { data } = useQuery({
    queryKey,
    queryFn: () => getAdminOrders({
      page: String(page), limit: '20', type: 'customer',
      ...(statusFilter && { status: statusFilter }),
      ...(search && { search }),
    }),
  });

  const orders = data?.orders || [];
  const totalPages = data?.pagination?.pages || 1;

  useEffect(() => {
    setLocalStatus({});
    setLocalPayment({});
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: ({ id, status, paymentStatus }: { id: string; status?: string; paymentStatus?: string }) =>
      updateOrderStatus(id, status, undefined, paymentStatus),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const getStatus = (orderId: string, serverStatus: string) => localStatus[orderId] || serverStatus;
  const getPayment = (orderId: string, serverPayment: string) => localPayment[orderId] || serverPayment;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">سفارشات</h1>

      <div className="flex gap-2 mb-4">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="جستجو بر اساس نام، تلفن، کد رهگیری..." className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
          <option value="">همه وضعیت‌ها</option>
          {statuses.map((key) => (
            <option key={key} value={key}>{statusLabel[key]}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-medium">کد سفارش</th>
                <th className="text-right px-4 py-3 font-medium">کاربر</th>
                <th className="text-right px-4 py-3 font-medium">مبلغ</th>
                <th className="text-right px-4 py-3 font-medium">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium">روش پرداخت</th>
                <th className="text-right px-4 py-3 font-medium">پرداخت</th>
                <th className="text-right px-4 py-3 font-medium">کد رهگیری</th>
                <th className="text-right px-4 py-3 font-medium">تاریخ</th>
                <th className="text-left px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: { _id: string; orderId?: string; user?: { name: string }; totalAmount: number; status: string; paymentMethod?: string; paymentStatus: string; paymentInfo?: { receiptImage?: string; transactionId?: string }; trackingCode?: string; createdAt: string }) => {
                const displayStatus = getStatus(order._id, order.status);
                const displayPayment = getPayment(order._id, order.paymentStatus);
                return (
                  <tr key={order._id} onClick={() => router.push(`/admin/orders/${order._id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer">
                    <td className="px-4 py-3 font-medium text-xs font-mono" dir="ltr">{order.orderId || order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 font-medium">{order.user?.name || 'کاربر'}</td>
                    <td className="px-4 py-3">{formatPrice(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 border rounded text-xs font-medium ${
                        displayStatus === 'delivered' ? 'bg-success/10 text-success border-success/30' :
                        displayStatus === 'cancelled' ? 'bg-danger/10 text-danger border-danger/30' :
                        displayStatus === 'shipped' ? 'bg-info/10 text-info border-info/30' :
                        'bg-warning/10 text-warning border-warning/30'
                      }`}>
                        {statusLabel[displayStatus] || displayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{paymentMethodLabel[order.paymentMethod || ''] || order.paymentMethod || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 border rounded text-xs font-medium ${paymentStatusColors[displayPayment] || 'bg-gray-100'}`}>
                        {paymentStatusLabel[displayPayment] || displayPayment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.trackingCode ? (
                        <span className="text-xs font-mono" dir="ltr">{order.trackingCode}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3 text-left">
                      <button onClick={(e) => { e.stopPropagation(); if (confirm('حذف شود؟')) deleteMutation.mutate(order._id); }}
                        className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
                    </td>
                  </tr>
                );
              })}
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

export default AdminOrders;
