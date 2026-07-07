'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '@/services/orderService';
import { getProfile } from '@/services/userService';
import { useAuth } from '@/providers/AuthProvider';
import SEO from '@/components/common/SEO';
import type { IAddress } from '@/types';

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!user,
  });

  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    enabled: !!user,
  });

  const addresses: IAddress[] = addressesData?.addresses || [];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', province: '', city: '', fullAddress: '', postalCode: '', phone: '' });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowForm(false);
      resetForm();
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ثبت آدرس');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditingId(null);
      setShowForm(false);
      resetForm();
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ویرایش آدرس');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const resetForm = () => {
    setForm({ title: '', province: '', city: '', fullAddress: '', postalCode: '', phone: '' });
    setError('');
  };

  const handleEdit = (addr: IAddress) => {
    setForm({
      title: addr.title || '',
      province: addr.province || '',
      city: addr.city || '',
      fullAddress: addr.fullAddress || '',
      postalCode: addr.postalCode || '',
      phone: addr.phone || '',
    });
    setEditingId(addr._id || null);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SEO title="پروفایل" />
      <h1 className="text-2xl font-bold mb-6">پروفایل</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-bold mb-4">اطلاعات حساب</h2>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">نام:</span> {profileData?.user?.name || user?.name}</p>
          <p><span className="text-gray-500">ایمیل:</span> {profileData?.user?.email || user?.email}</p>
          <p><span className="text-gray-500">موبایل:</span> {profileData?.user?.phone || user?.phone || '—'}</p>
          <p><span className="text-gray-500">نقش:</span> {user?.role === 'admin' ? 'مدیر' : user?.role === 'seller' ? 'فروشنده' : 'کاربر'}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">آدرس‌ها</h2>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }}
            className="text-primary text-sm hover:underline">
            {showForm ? 'انصراف' : 'افزودن آدرس'}
          </button>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl mb-4">{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">عنوان</label>
                <input type="text" name="title" value={form.title} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="منزل، محل کار" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">موبایل</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="09123456789" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">استان</label>
                <input type="text" name="province" value={form.province} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">شهر</label>
                <input type="text" name="city" value={form.city} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" required />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">آدرس کامل</label>
              <textarea name="fullAddress" value={form.fullAddress} onChange={handleChange} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">کد پستی</label>
              <input type="text" name="postalCode" value={form.postalCode} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" required />
            </div>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
              {editingId ? 'ویرایش آدرس' : 'ثبت آدرس'}
            </button>
          </form>
        )}

        {addressesLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 shimmer rounded-lg" />)}</div>
        ) : addresses.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">آدرسی ثبت نشده است</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr._id} className="border border-gray-200 rounded-xl p-4 text-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{addr.title}</p>
                    <p className="text-gray-500">{addr.province}، {addr.city}، {addr.fullAddress}</p>
                    <p className="text-gray-400">کد پستی: {addr.postalCode} | تلفن: {addr.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(addr)} className="text-primary text-xs hover:underline">ویرایش</button>
                    <button onClick={() => deleteMutation.mutate(addr._id!)} className="text-danger text-xs hover:underline">حذف</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
