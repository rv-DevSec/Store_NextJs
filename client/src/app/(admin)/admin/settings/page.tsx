'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings } from '@/services/productService';
import api from '@/lib/api';

const SettingsForm = ({ settings: s }: { settings: Record<string, unknown> }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    phone: (s.phone as string) || '',
    email: (s.email as string) || '',
    address: (s.address as string) || '',
    about: (s.about as string) || '',
    zarinpalEnabled: (s.zarinpal as Record<string, unknown>)?.enabled !== false,
    zarinpalMerchantId: (s.zarinpalMerchantId as string) || '',
    cardToCardActive: !!((s.cardToCard as Record<string, unknown>)?.active),
    cardToCardBankName: (s.cardToCard as Record<string, unknown>)?.bankName as string || '',
    cardToCardCardNumber: (s.cardToCard as Record<string, unknown>)?.cardNumber as string || '',
    cardToCardCardHolder: (s.cardToCard as Record<string, unknown>)?.cardHolder as string || '',
    shippingPrice: String(s.shippingPrice || ''),
  });

  const saveMutation = useMutation({
    mutationFn: async (settingsData: Record<string, unknown>) => {
      const { data: res } = await api.put('/settings', settingsData);
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = () => {
    saveMutation.mutate({
      phone: form.phone, email: form.email, address: form.address, about: form.about,
      shippingPrice: form.shippingPrice ? Number(form.shippingPrice) : undefined,
      zarinpalMerchantId: form.zarinpalMerchantId,
      zarinpal: { enabled: form.zarinpalEnabled },
      cardToCard: {
        active: form.cardToCardActive, bankName: form.cardToCardBankName,
        cardNumber: form.cardToCardCardNumber, cardHolder: form.cardToCardCardHolder,
      },
    });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">تنظیمات سایت</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">تلفن</label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ایمیل</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">آدرس</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">درباره ما</label>
            <textarea name="about" value={form.about} onChange={handleChange} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">هزینه ارسال</label>
            <input type="number" name="shippingPrice" value={form.shippingPrice} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold mb-4">تنظیمات زرین‌پال</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="zarinpalEnabled" checked={form.zarinpalEnabled} onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
              <span className="text-sm">فعال</span>
            </label>
            <div>
              <label className="block text-xs text-gray-500 mb-1">مرچنت آیدی</label>
              <input type="text" name="zarinpalMerchantId" value={form.zarinpalMerchantId} onChange={handleChange}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold mb-4">کارت به کارت</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="cardToCardActive" checked={form.cardToCardActive} onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
              <span className="text-sm">فعال</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">نام بانک</label>
                <input type="text" name="cardToCardBankName" value={form.cardToCardBankName} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">شماره کارت</label>
                <input type="text" name="cardToCardCardNumber" value={form.cardToCardCardNumber} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">صاحب حساب</label>
                <input type="text" name="cardToCardCardHolder" value={form.cardToCardCardHolder} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={saveMutation.isPending}
          className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
          {saveMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </button>
        {saveMutation.isSuccess && <p className="text-xs text-success">تنظیمات با موفقیت ذخیره شد</p>}
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return <SettingsForm settings={data?.settings || {}} key={data ? 'loaded' : 'initial'} />;
};

export default AdminSettings;
