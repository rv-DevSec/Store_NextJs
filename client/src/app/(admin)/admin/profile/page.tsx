'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/api';

const AdminProfile = () => {
  const { user, setUser, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!user || user.role !== 'admin') {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const body: Record<string, string> = {};
    if (username !== user.username) body.username = username;
    if (newPassword) {
      if (!currentPassword) { setError('برای تغییر رمز عبور، رمز فعلی را وارد کنید'); return; }
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    if (Object.keys(body).length === 0) { setError('هیچ تغییری داده نشده'); return; }

    setSaving(true);
    try {
      const { data } = await api.put('/admin/profile', body);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess('پروفایل با موفقیت به‌روزرسانی شد');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ذخیره';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">پروفایل مدیریت</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-xs text-gray-500 mb-1">نام</label>
          <input type="text" value={user.name} disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">نام کاربری</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>
        <hr className="border-gray-200" />
        <p className="text-xs text-gray-400">برای تغییر رمز عبور، فیلدهای زیر را پر کنید</p>
        <div>
          <label className="block text-xs text-gray-500 mb-1">رمز عبور فعلی</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">رمز عبور جدید</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="حداقل ۶ کاراکتر"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {success && <p className="text-xs text-success">{success}</p>}
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </form>
    </div>
  );
};

export default AdminProfile;
