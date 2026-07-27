'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import SEO from '@/components/common/SEO';

const Register = () => {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, username: form.username, email: form.email, password: form.password, phone: form.phone });
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ثبت‌نام';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <SEO title="ثبت‌نام" />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">ثبت‌نام</h1>
          <p className="text-gray-500 text-sm mt-2">ایجاد حساب کاربری جدید</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl mb-4 animate-fade-in">{error}</div>
        )}
        {success && (
          <div className="bg-success/10 text-success text-sm p-3 rounded-xl mb-4 animate-fade-in">{success}</div>
        )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                placeholder="نام خود را وارد کنید" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام کاربری</label>
              <input type="text" name="username" value={form.username} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                placeholder="نام کاربری برای ورود" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                placeholder="your@email.com" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره موبایل</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                placeholder="09123456789" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                placeholder="حداقل ۶ کاراکتر" required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 shadow-lg shadow-primary/25">
              {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
            </button>
          </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          حساب کاربری دارید؟{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">ورود</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
