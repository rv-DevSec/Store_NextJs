'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminSellers, adminCreateSeller, adminUpdateSeller, adminDeleteSeller } from '@/services/orderService';
import { formatDateTime } from '@/lib/utils/numbers';

const emptyForm = { name: '', username: '', password: '', phone: '', markupPercent: '' };

const AdminSellers = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-sellers'], queryFn: getAdminSellers });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const sellers = data?.sellers || [];

  const createMutation = useMutation({
    mutationFn: adminCreateSeller,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-sellers'] }); closeModal(); },
    onError: (err: unknown) => setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) => adminUpdateSeller(id, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-sellers'] }); closeModal(); },
    onError: (err: unknown) => setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminUpdateSeller(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sellers'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteSeller,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sellers'] }),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (seller: { _id: string; name: string; username: string; phone?: string; markupPercent?: number }) => {
    setEditId(seller._id);
    setForm({ name: seller.name, username: seller.username, password: '', phone: seller.phone || '', markupPercent: String(seller.markupPercent ?? '') });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (editId) {
      const updates: Record<string, unknown> = { name: form.name, username: form.username, phone: form.phone, markupPercent: form.markupPercent ? Number(form.markupPercent) : 0 };
      if (form.password) updates.password = form.password;
      updateMutation.mutate({ id: editId, updates });
    } else {
      if (!form.password || form.password.length < 6) { setError('رمز عبور باید حداقل ۶ کاراکتر باشد'); return; }
      createMutation.mutate({ name: form.name, username: form.username, phone: form.phone, password: form.password, markupPercent: form.markupPercent ? Number(form.markupPercent) : 0 });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">فروشندگان</h1>
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/25">
          افزودن فروشنده
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-medium">نام</th>
                <th className="text-right px-4 py-3 font-medium">نام کاربری</th>
                <th className="text-right px-4 py-3 font-medium">موبایل</th>
                <th className="text-right px-4 py-3 font-medium">درصد افزایش</th>
                <th className="text-right px-4 py-3 font-medium">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium">تاریخ عضویت</th>
                <th className="text-left px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller: { _id: string; name: string; username: string; phone?: string; markupPercent?: number; isActive?: boolean; createdAt: string }) => (
                <tr key={seller._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{seller.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500" dir="ltr">{seller.username}</td>
                  <td className="px-4 py-3 text-xs text-gray-500" dir="ltr">{seller.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{seller.markupPercent ?? 0}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs ${
                      seller.isActive !== false ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                    }`}>
                      {seller.isActive !== false ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(seller.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => toggleActiveMutation.mutate({ id: seller._id, isActive: seller.isActive !== false ? false : true })}
                        className={`text-xs px-2 py-1 rounded-lg transition ${
                          seller.isActive !== false ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-success/10 text-success hover:bg-success/20'
                        }`}>
                        {seller.isActive !== false ? 'غیرفعال' : 'فعال'}
                      </button>
                      <button onClick={() => openEdit(seller)}
                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition">ویرایش</button>
                      <button onClick={() => { if (confirm('فروشنده غیرفعال شود؟')) deleteMutation.mutate(seller._id); }}
                        className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {sellers.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500">فروشنده‌ای وجود ندارد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editId ? 'ویرایش فروشنده' : 'افزودن فروشنده'}</h2>

            {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام کاربری</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" dir="ltr" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور {editId && <span className="text-gray-400 font-normal">(خالی بگذارید تغییری نکند)</span>}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" required={!editId} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شماره موبایل</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">درصد افزایش قیمت</label>
                <input type="number" value={form.markupPercent} onChange={(e) => setForm({ ...form, markupPercent: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" min="0" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50">
                  {editId ? 'ویرایش' : 'افزودن'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellers;
