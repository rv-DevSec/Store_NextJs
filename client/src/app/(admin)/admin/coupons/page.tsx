'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon } from '@/services/orderService';
import { formatPrice, toPersianNumber, formatDateTime } from '@/lib/utils/numbers';

const AdminCoupons = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-coupons'], queryFn: adminGetCoupons });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', value: '', type: 'percent', usageLimit: '', expiresAt: '' });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: adminCreateCoupon,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); resetForm(); },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminUpdateCoupon(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); resetForm(); },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const coupons = data?.coupons || [];

  const resetForm = () => { setShowForm(false); setEditingId(null); setError(''); setForm({ code: '', value: '', type: 'percent', usageLimit: '', expiresAt: '' }); };

  const handleEdit = (c: Record<string, unknown>) => {
    setEditingId(c._id as string);
    setForm({
      code: c.code as string || '',
      value: String(c.value || ''),
      type: c.type as string || 'percent',
      usageLimit: String(c.usageLimit || ''),
      expiresAt: c.expiresAt ? (c.expiresAt as string).slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    setError('');
    const payload: Record<string, unknown> = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      expiresAt: form.expiresAt || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">کد تخفیف</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition">
          + کد جدید
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-bold">{editingId ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'}</h2>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">کد</label>
              <input type="text" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">مقدار تخفیف</label>
              <input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">نوع تخفیف</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="percent">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">حداکثر استفاده</label>
              <input type="number" value={form.usageLimit} onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">تاریخ انقضا</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
              {editingId ? 'ویرایش' : 'ایجاد'}
            </button>
            <button onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">انصراف</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-medium">کد</th>
                <th className="text-right px-4 py-3 font-medium">مقدار</th>
                <th className="text-right px-4 py-3 font-medium">نوع</th>
                <th className="text-right px-4 py-3 font-medium">استفاده</th>
                <th className="text-right px-4 py-3 font-medium">انقضا</th>
                <th className="text-left px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: { _id: string; code: string; value: number; type: string; usedCount?: number; usageLimit?: number; expiresAt?: string }) => (
                <tr key={coupon._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{coupon.code}</td>
                  <td className="px-4 py-3">{coupon.type === 'percent' ? `%${toPersianNumber(coupon.value)}` : formatPrice(coupon.value)}</td>
                  <td className="px-4 py-3 text-gray-500">{coupon.type === 'percent' ? 'درصدی' : 'ثابت'}</td>
                  <td className="px-4 py-3">{toPersianNumber(coupon.usedCount || 0)}{coupon.usageLimit ? ` / ${toPersianNumber(coupon.usageLimit)}` : ''}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{coupon.expiresAt ? formatDateTime(coupon.expiresAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleEdit(coupon)} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition">ویرایش</button>
                      <button onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(coupon._id); }} className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">کد تخفیفی وجود ندارد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;
