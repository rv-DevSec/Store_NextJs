'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import SEO from '@/components/common/SEO';

const Login = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.role === 'admin') router.push('/admin');
      else if (data.user.role === 'seller') router.push('/seller');
      else router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ورود';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <SEO title="ورود" />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">ورود به حساب</h1>
          <p className="text-gray-500 text-sm mt-2">خوش آمدید</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl mb-4 animate-fade-in">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل یا نام کاربری</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              placeholder="your@email.com یا نام کاربری" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              placeholder="••••••••" required />
          </div>
          <div className="flex justify-between items-center text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">رمز عبور را فراموش کرده‌اید؟</Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 shadow-lg shadow-primary/25">
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          حساب کاربری ندارید؟{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">ثبت‌نام</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
