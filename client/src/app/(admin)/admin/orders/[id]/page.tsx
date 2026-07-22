'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById, updateOrderStatus, downloadInvoice } from '@/services/orderService';
import { formatPrice, toPersianNumber, formatDateTime } from '@/lib/utils/numbers';
import Link from 'next/link';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const statusLabel: Record<string, string> = {
  pending: 'در انتظار', processing: 'در حال پردازش', shipped: 'ارسال شده', delivered: 'تحویل شده', cancelled: 'لغو شده',
};

const paymentStatusLabel: Record<string, string> = {
  pending: 'در انتظار پرداخت', paid: 'پرداخت شده', failed: 'ناموفق', refunded: 'مسترد شده',
};

const paymentMethodLabel: Record<string, string> = {
  zarinpal: 'زرین‌پال', cod: 'حضوری', 'card-to-card': 'کارت به کارت',
};

const AdminOrderDetail = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [newStatus, setNewStatus] = useState('');
  const [newPayment, setNewPayment] = useState('');
  const [trackingCode, setTrackingCode] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
  });

  const order = data?.order;

  const updateMutation = useMutation({
    mutationFn: ({ status, paymentStatus, trackingCode: tc }: { status?: string; paymentStatus?: string; trackingCode?: string }) =>
      updateOrderStatus(id, status, tc, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setNewStatus('');
      setNewPayment('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">سفارش یافت نشد</p>
        <Link href="/admin/orders" className="text-primary hover:underline mt-2 inline-block">بازگشت به سفارشات</Link>
      </div>
    );
  }

  const isCardToCard = order.paymentMethod === 'card-to-card';
  const receiptImage = order.paymentInfo?.receiptImage;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600 transition p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">جزئیات سفارش</h1>
        </div>
        <button onClick={() => downloadInvoice(id)}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition">
          دانلود فاکتور
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold mb-4">اطلاعات سفارش</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">کد سفارش: </span><span dir="ltr" className="font-medium">{order.orderId || id.slice(-8).toUpperCase()}</span></div>
              <div><span className="text-gray-500">تاریخ: </span>{formatDateTime(order.createdAt)}</div>
              <div>
                <span className="text-gray-500">وضعیت: </span>
                <select value={newStatus || order.status} onChange={(e) => setNewStatus(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs">
                  {statuses.map((key) => (
                    <option key={key} value={key}>{statusLabel[key]}</option>
                  ))}
                </select>
                {newStatus && newStatus !== order.status && (
                  <button onClick={() => updateMutation.mutate({ status: newStatus })}
                    className="mr-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded">ذخیره</button>
                )}
              </div>
              <div>
                <span className="text-gray-500">روش پرداخت: </span>{paymentMethodLabel[order.paymentMethod] || order.paymentMethod}
              </div>
              <div>
                <span className="text-gray-500">پرداخت: </span>
                <select value={newPayment || order.paymentStatus} onChange={(e) => setNewPayment(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs">
                  {Object.entries(paymentStatusLabel).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {newPayment && newPayment !== order.paymentStatus && (
                  <button onClick={() => updateMutation.mutate({ paymentStatus: newPayment })}
                    className="mr-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded">ذخیره</button>
                )}
              </div>
              <div>
                <span className="text-gray-500">مبلغ: </span>
                <span className="font-bold">{formatPrice(order.totalAmount)}</span>
              </div>
              <div>
                <span className="text-gray-500">کد رهگیری: </span>
                <input type="text" value={trackingCode || order.trackingCode || ''}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs w-32" />
                {trackingCode && (
                  <button onClick={() => updateMutation.mutate({ trackingCode })}
                    className="mr-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded">ذخیره</button>
                )}
              </div>
              {order.coupon && <div><span className="text-gray-500">کد تخفیف: </span>اعمال شده</div>}
              {order.discountAmount > 0 && <div><span className="text-gray-500">تخفیف: </span><span className="text-danger">{formatPrice(order.discountAmount)}</span></div>}
            </div>
          </div>

          {order.shippingAddress && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-bold mb-4">آدرس تحویل</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="text-gray-500">نام: </span>{order.shippingAddress.fullName} - {order.shippingAddress.phone}</p>
                <p><span className="text-gray-500">آدرس: </span>{order.shippingAddress.province}، {order.shippingAddress.city}، {order.shippingAddress.fullAddress}</p>
                <p><span className="text-gray-500">کد پستی: </span>{order.shippingAddress.postalCode}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold mb-4">محصولات ({toPersianNumber(order.items.length)})</h2>
            <div className="space-y-3">
              {order.items.map((item: { image?: string; name: string; price: number; qty: number }, idx: number) => (
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
            <div className="border-t border-gray-200 pt-3 mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">مبلغ کل</span><span>{formatPrice(order.totalAmount + order.discountAmount)}</span></div>
              {order.discountAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">تخفیف</span><span className="text-danger">{formatPrice(order.discountAmount)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>قابل پرداخت</span><span>{formatPrice(order.totalAmount)}</span></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold mb-4">کاربر</h2>
            <div className="text-sm space-y-2">
              <p><span className="text-gray-500">نام: </span>{order.user?.name || '—'}</p>
              <p><span className="text-gray-500">ایمیل: </span>{order.user?.email || '—'}</p>
              <p><span className="text-gray-500">تلفن: </span>{order.user?.phone || '—'}</p>
            </div>
          </div>

          {(isCardToCard || order.type === 'seller') && (
            <div className={`bg-white border rounded-xl p-6 ${receiptImage && order.paymentStatus === 'pending' ? 'border-yellow-300' : 'border-gray-200'}`}>
              <h2 className="font-bold mb-4">{order.type === 'seller' ? 'رسید پرداخت' : 'پرداخت کارت به کارت'}</h2>
              {receiptImage ? (
                <div className="space-y-4">
                  <a href={receiptImage} target="_blank" rel="noopener noreferrer">
                    <img src={receiptImage} alt="رسید پرداخت" className="w-full rounded-lg border border-gray-200" />
                  </a>
                  <p className="text-xs text-gray-500">
                    وضعیت: {paymentStatusLabel[order.paymentStatus]}
                  </p>
                  {order.paymentStatus === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateMutation.mutate({ paymentStatus: 'paid' })}
                        className="flex-1 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                        تأیید پرداخت
                      </button>
                      <button onClick={() => updateMutation.mutate({ paymentStatus: 'failed' })}
                        className="flex-1 px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                        رد پرداخت
                      </button>
                    </div>
                  )}
                  {order.paymentStatus === 'paid' && (
                    <p className="text-sm text-success font-medium">✅ این پرداخت تأیید شده است</p>
                  )}
                  {order.paymentStatus === 'failed' && (
                    <p className="text-sm text-danger font-medium">❌ این پرداخت رد شده است</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">هنوز رسیدی آپلود نشده است.</p>
              )}
            </div>
          )}

          {order.paymentInfo?.transactionId && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-bold mb-4">اطلاعات تراکنش</h2>
              <p className="text-sm"><span className="text-gray-500">کد تراکنش: </span><span dir="ltr">{order.paymentInfo.transactionId}</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
