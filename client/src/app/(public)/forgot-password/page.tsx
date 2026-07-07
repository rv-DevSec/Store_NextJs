'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import SEO from '@/components/common/SEO';
import { isValidEmail } from '@/lib/utils/validation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!isValidEmail(email)) {
      setError('لطفاً یک ایمیل معتبر وارد کنید');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ارسال ایمیل';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <SEO title="بازیابی رمز عبور" />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">بازیابی رمز عبور</h1>
          <p className="text-gray-500 text-sm mt-2">ایمیل خود را وارد کنید تا لینک بازیابی برای شما ارسال شود</p>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl mb-4">{error}</div>}
        {message && <div className="bg-success/10 text-success text-sm p-3 rounded-xl mb-4">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              placeholder="your@email.com" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 shadow-lg shadow-primary/25">
            {loading ? 'در حال ارسال...' : 'ارسال لینک بازیابی'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-primary hover:underline">بازگشت به ورود</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
