'use client';

import { useState } from 'react';
import { createProductRequest } from '@/services/productService';
import SEO from '@/components/common/SEO';

const RequestProduct = () => {
  const [form, setForm] = useState({ name: '', phone: '', productName: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.productName.trim()) {
      setError('نام، شماره تماس و نام محصول الزامی است');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createProductRequest(form);
      setSuccess(true);
      setForm({ name: '', phone: '', productName: '', description: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ثبت درخواست';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <SEO title="درخواست محصول" description="محصول مورد نظر خود را به ما بگویید تا برای شما تأمین کنیم" />
      <h1 className="text-2xl font-bold mb-2">درخواست محصول</h1>
      <p className="text-sm text-gray-500 mb-6">محصولی که نیاز دارید و در فروشگاه موجود نیست را به ما بگویید.</p>

      {success ? (
        <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-success font-bold text-lg mb-2">درخواست شما با موفقیت ثبت شد</p>
          <p className="text-sm text-gray-500 mb-4">کارشناسان ما در اسرع وقت با شما تماس خواهند گرفت</p>
          <button onClick={() => setSuccess(false)}
            className="text-primary hover:underline text-sm">ثبت درخواست جدید</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          {error && <p className="text-sm text-danger bg-danger/10 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs text-gray-500 mb-1">نام و نام خانوادگی</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">شماره تماس</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">نام محصول</label>
            <input type="text" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">توضیحات (اختیاری)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50">
            {loading ? 'در حال ثبت...' : 'ثبت درخواست'}
          </button>
        </form>
      )}
    </div>
  );
};

export default RequestProduct;
