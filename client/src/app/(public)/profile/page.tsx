'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '@/services/orderService';
import { getProfile, updateProfile } from '@/services/userService';
import { useAuth } from '@/providers/AuthProvider';
import SEO from '@/components/common/SEO';
import type { IAddress } from '@/types';

const Profile = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!user,
  });

  const serverUser = profileData?.user || user;

  const [infoForm, setInfoForm] = useState({ name: '', username: '', email: '', phone: '' });
  const [infoSyncedKey, setInfoSyncedKey] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');

  const profileKey = serverUser ? `${serverUser.name}|${serverUser.username}|${serverUser.email}|${serverUser.phone}` : '';
  if (profileKey && profileKey !== infoSyncedKey) {
    setInfoForm({
      name: serverUser.name || '',
      username: serverUser.username || '',
      email: serverUser.email || '',
      phone: serverUser.phone || '',
    });
    setInfoSyncedKey(profileKey);
  }

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoSuccess('');

    const body: Record<string, string> = {};
    if (infoForm.name !== (serverUser?.name || '')) body.name = infoForm.name;
    if (infoForm.username !== (serverUser?.username || '')) body.username = infoForm.username;
    if ((infoForm.email || '') !== (serverUser?.email || '')) body.email = infoForm.email;
    if ((infoForm.phone || '') !== (serverUser?.phone || '')) body.phone = infoForm.phone;
    if (newPassword) {
      if (!currentPassword) { setError('برای تغییر رمز عبور، رمز فعلی را وارد کنید'); return; }
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    if (Object.keys(body).length === 0) { setInfoSuccess('هیچ تغییری داده نشده'); return; }

    setSavingInfo(true);
    try {
      const res = await updateProfile(body);
      setUser(res.user);
      localStorage.setItem('user', JSON.stringify(res.user));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setInfoSuccess('اطلاعات با موفقیت به‌روزرسانی شد');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ذخیره اطلاعات';
      setError(msg);
    } finally {
      setSavingInfo(false);
    }
  };

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
        <div className="space-y-2 text-sm mb-4">
          <p><span className="text-gray-500">نقش:</span> {user?.role === 'admin' ? 'مدیر' : user?.role === 'seller' ? 'فروشنده' : 'کاربر'}</p>
        </div>
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">نام</label>
              <input type="text" value={infoForm.name} onChange={(e) => setInfoForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">نام کاربری</label>
              <input type="text" value={infoForm.username} onChange={(e) => setInfoForm((p) => ({ ...p, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ایمیل</label>
              <input type="email" value={infoForm.email} onChange={(e) => setInfoForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">موبایل
                {serverUser?.phoneVerified
                  ? <span className="mr-2 text-success text-[10px]">✓ تأیید شده</span>
                  : <span className="mr-2 text-danger text-[10px]">تأیید نشده</span>}
              </label>
              <input type="tel" value={infoForm.phone} onChange={(e) => setInfoForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <hr className="border-gray-200" />
          <p className="text-xs text-gray-400">برای تغییر رمز عبور، فیلدهای زیر را پر کنید</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">رمز عبور فعلی</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">رمز عبور جدید</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل ۸ کاراکتر با حرف و عدد"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
          {infoSuccess && <p className="text-xs text-success">{infoSuccess}</p>}

          <button type="submit" disabled={savingInfo}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
            {savingInfo ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </form>
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
