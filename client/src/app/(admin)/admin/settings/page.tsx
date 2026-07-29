'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings } from '@/services/productService';
import api from '@/lib/api';
import { toAbsoluteUploadUrl } from '@/lib/utils/uploadUrl';

const SettingsForm = ({ settings: s }: { settings: Record<string, unknown> }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    phones: Array.isArray(s.phones) ? (s.phones as { name?: string; tel?: string }[]) : [],
    email: (s.email as string) || '',
    address: (s.address as string) || '',
    about: (s.about as string) || '',
    headerImage: (s.headerImage as string) || '',
    logo: (s.logo as string) || '',
    favicon: (s.favicon as string) || '',
    siteName: (s.siteName as string) || '',
    heroTitle: (s.heroTitle as string) || '',
    heroSubtitle: (s.heroSubtitle as string) || '',
    zarinpalEnabled: (s.zarinpal as Record<string, unknown>)?.enabled !== false,
    zarinpalMerchantId: (s.zarinpalMerchantId as string) || '',
    cardToCardActive: !!((s.cardToCard as Record<string, unknown>)?.active),
    cardToCardBankName: (s.cardToCard as Record<string, unknown>)?.bankName as string || '',
    cardToCardCardNumber: (s.cardToCard as Record<string, unknown>)?.cardNumber as string || '',
    cardToCardCardHolder: (s.cardToCard as Record<string, unknown>)?.accountHolder as string || '',
    shippingPrice: String(s.shippingPrice || ''),
    festivalActive: !!((s.festival as Record<string, unknown>)?.active),
    festivalTopBanner: !!((s.festival as Record<string, unknown>)?.topBanner),
    festivalTopBannerText: ((s.festival as Record<string, unknown>)?.topBannerText as string) || '',
    festivalTitle: ((s.festival as Record<string, unknown>)?.title as string) || 'فروش ویژه',
    festivalSubtitle: ((s.festival as Record<string, unknown>)?.subtitle as string) || '',
    festivalBtnText: ((s.festival as Record<string, unknown>)?.btnText as string) || 'مشاهده محصولات',
    festivalBgColor: ((s.festival as Record<string, unknown>)?.bgColor as string) || '#dc2626',
    hidePrices: (s.hidePrices as boolean) || false,
    socials: (s.socials as Record<string, { active: boolean; link: string; icon: string }>) || {},
    distributor: (s.distributor as { active: boolean; title: string; brands: { name: string; logo: string }[] }) || { active: false, title: 'نمایندگی پخش عمده هرینگتون و ویژن', brands: [] },
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

  const handlePhoneChange = (index: number, field: 'name' | 'tel', value: string) => {
    setForm((prev) => {
      const phones = [...prev.phones];
      phones[index] = { ...phones[index], [field]: value };
      return { ...prev, phones };
    });
  };

  const addPhone = () => setForm((prev) => ({ ...prev, phones: [...prev.phones, { name: '', tel: '' }] }));
  const removePhone = (index: number) => setForm((prev) => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data: res } = await api.post('/upload/image', formData);
      if (res?.url) {
        setForm((prev) => ({ ...prev, headerImage: res.url }));
      }
    } catch {
      // ignore
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data: res } = await api.post('/upload/image', formData);
      if (res?.url) {
        setForm((prev) => ({ ...prev, logo: res.url }));
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = () => {
    saveMutation.mutate({
      phones: form.phones.filter(p => p.tel?.trim()), email: form.email, address: form.address, about: form.about,
      headerImage: form.headerImage,
      logo: form.logo,
      favicon: form.favicon || undefined,
      siteName: form.siteName || undefined,
      shippingPrice: form.shippingPrice ? Number(form.shippingPrice) : undefined,
      zarinpalMerchantId: form.zarinpalMerchantId,
      zarinpal: { enabled: form.zarinpalEnabled },
      cardToCard: {
        active: form.cardToCardActive, bankName: form.cardToCardBankName,
        cardNumber: form.cardToCardCardNumber, accountHolder: form.cardToCardCardHolder,
      },
      festival: {
        active: form.festivalActive,
        topBanner: form.festivalTopBanner,
        topBannerText: form.festivalTopBannerText,
        title: form.festivalTitle,
        subtitle: form.festivalSubtitle,
        btnText: form.festivalBtnText,
        bgColor: form.festivalBgColor,
      },
      hidePrices: form.hidePrices,
      heroTitle: form.heroTitle || undefined,
      heroSubtitle: form.heroSubtitle || undefined,
      socials: {
        telegram: { active: form.socials.telegram?.active || false, link: form.socials.telegram?.link || '', icon: form.socials.telegram?.icon || '' },
        rubika: { active: form.socials.rubika?.active || false, link: form.socials.rubika?.link || '', icon: form.socials.rubika?.icon || '' },
        bale: { active: form.socials.bale?.active || false, link: form.socials.bale?.link || '', icon: form.socials.bale?.icon || '' },
      },
      distributor: {
        active: form.distributor.active,
        title: form.distributor.title || 'نمایندگی پخش عمده هرینگتون و ویژن',
        brands: form.distributor.brands.filter(b => b.name.trim()),
      },
    });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">تنظیمات سایت</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h3 className="font-bold mb-4">تصویر هدر</h3>
          <div className="flex items-center gap-3">
            {form.headerImage ? (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200">
                <img src={toAbsoluteUploadUrl(form.headerImage)} alt="هدر" className="w-full h-full object-cover" />
                <button onClick={() => setForm((prev) => ({ ...prev, headerImage: '' }))}
                  className="absolute top-1 left-1 w-5 h-5 bg-danger/80 text-white rounded-full text-xs flex items-center justify-center hover:bg-danger transition">×</button>
              </div>
            ) : (
              <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">بدون تصویر</div>
            )}
            <label className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm cursor-pointer hover:bg-primary/20 transition">
              آپلود تصویر
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleHeaderImageUpload} />
            </label>
            <p className="text-xs text-gray-400">تصویر پس‌زمینه هدر سایت (جایگزین رنگ پیش‌فرض)</p>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h3 className="font-bold mb-4">لوگوی سایت</h3>
          <div className="flex items-center gap-3">
            {form.logo ? (
              <div className="relative w-28 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-2">
                <img src={toAbsoluteUploadUrl(form.logo)} alt="لوگو" className="max-w-full max-h-full object-contain" />
                <button onClick={() => setForm((prev) => ({ ...prev, logo: '' }))}
                  className="absolute top-1 left-1 w-5 h-5 bg-danger/80 text-white rounded-full text-xs flex items-center justify-center hover:bg-danger transition">×</button>
              </div>
            ) : (
              <div className="w-28 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">بدون لوگو</div>
            )}
            <label className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm cursor-pointer hover:bg-primary/20 transition">
              آپلود لوگو
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleLogoUpload} />
            </label>
            <p className="text-xs text-gray-400">لوگوی سایت (جایگزین متن پیش‌فرض در هدر)</p>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h3 className="font-bold mb-4">فاوآیکون (Favicon)</h3>
          <div className="flex items-center gap-3">
            {form.favicon ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-1">
                <img src={toAbsoluteUploadUrl(form.favicon)} alt="فاوآیکون" className="max-w-full max-h-full object-contain" />
                <button onClick={() => setForm((prev) => ({ ...prev, favicon: '' }))}
                  className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-danger/80 text-white rounded-full text-[8px] flex items-center justify-center hover:bg-danger transition">×</button>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-[10px]">بدون</div>
            )}
            <label className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm cursor-pointer hover:bg-primary/20 transition">
              آپلود فاوآیکون
              <input type="file" accept="image/x-icon,image/png,image/jpeg" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append('image', file);
                  try {
                    const { data: res } = await api.post('/upload/image', fd);
                    if (res?.url) setForm((prev) => ({ ...prev, favicon: res.url }));
                  } catch { /* ignore */ }
                }} />
            </label>
            <p className="text-xs text-gray-400">آیکون برگه مرورگر (فرمت ico, png, jpg)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">نام سایت</label>
            <input type="text" name="siteName" value={form.siteName} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">عنوان بخش قهرمان (Hero) صفحه اصلی</label>
            <input type="text" name="heroTitle" value={form.heroTitle} onChange={handleChange}
              placeholder="فروشگاه تخصصی قطعات یدکی خودرو"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">زیرعنوان بخش قهرمان (Hero) صفحه اصلی</label>
            <input type="text" name="heroSubtitle" value={form.heroSubtitle} onChange={handleChange}
              placeholder="انواع قطعات یدکی خودروهای ایرانی و خارجی با بهترین کیفیت و قیمت"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">شماره تلفن‌ها</label>
            <div className="space-y-2">
              {form.phones.map((phone, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" value={phone.name || ''} onChange={(e) => handlePhoneChange(idx, 'name', e.target.value)}
                    placeholder="نام (مثال: مدیریت)"
                    className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                  <input type="text" value={phone.tel || ''} onChange={(e) => handlePhoneChange(idx, 'tel', e.target.value)}
                    placeholder="شماره تلفن"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                  {form.phones.length > 1 && (
                    <button type="button" onClick={() => removePhone(idx)}
                      className="px-2 py-2 text-danger hover:bg-danger/10 rounded-lg transition text-sm">حذف</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPhone}
                className="text-primary text-sm hover:underline">+ افزودن شماره</button>
            </div>
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
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold mb-4">شبکه‌های اجتماعی (پشتیبانی)</h3>
          {['telegram', 'rubika', 'bale'].map((name) => {
            const labels: Record<string, string> = { telegram: 'تلگرام', rubika: 'روبیکا', bale: 'بله' };
            const s = form.socials[name] || { active: false, link: '', icon: '' };
            return (
              <div key={name} className="border border-gray-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm">{labels[name]}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-500">فعال</span>
                    <input type="checkbox" checked={s.active}
                      onChange={(e) => setForm((prev) => ({ ...prev, socials: { ...prev.socials, [name]: { ...prev.socials[name], active: e.target.checked } } }))}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                  </label>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">لینک</label>
                    <input type="text" value={s.link}
                      onChange={(e) => setForm((prev) => ({ ...prev, socials: { ...prev.socials, [name]: { ...prev.socials[name], link: e.target.value } } }))}
                      placeholder={`لینک ${labels[name]}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">آیکون</label>
                    <div className="flex items-center gap-3">
                      {s.icon ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-1">
                          <img src={toAbsoluteUploadUrl(s.icon)} alt={labels[name]} className="max-w-full max-h-full object-contain" />
                          <button onClick={() => setForm((prev) => ({ ...prev, socials: { ...prev.socials, [name]: { ...prev.socials[name], icon: '' } } }))}
                            className="absolute top-0.5 left-0.5 w-4 h-4 bg-danger/80 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-danger transition">×</button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-[10px]">بدون آیکون</div>
                      )}
                      <label className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs cursor-pointer hover:bg-primary/20 transition">
                        آپلود آیکون
                        <input type="file" accept="image/jpeg,image/png" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append('image', file);
                            try {
                              const { data: res } = await api.post('/upload/image', fd);
                              if (res?.url) setForm((prev) => ({ ...prev, socials: { ...prev.socials, [name]: { ...prev.socials[name], icon: res.url } } }));
                            } catch { /* ignore */ }
                          }} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold mb-4">نمایندگی برندها</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.distributor.active}
                onChange={(e) => setForm((prev) => ({ ...prev, distributor: { ...prev.distributor, active: e.target.checked } }))}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
              <span className="text-sm">فعال (نمایش در صفحه اصلی)</span>
            </label>
            <div>
              <label className="block text-xs text-gray-500 mb-1">عنوان بخش</label>
              <input type="text" value={form.distributor.title}
                onChange={(e) => setForm((prev) => ({ ...prev, distributor: { ...prev.distributor, title: e.target.value } }))}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">برندها</label>
              <div className="space-y-3">
                {form.distributor.brands.map((brand, idx) => (
                  <div key={idx} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3">
                    <div className="flex-1">
                      <input type="text" value={brand.name}
                        onChange={(e) => {
                          const brands = [...form.distributor.brands];
                          brands[idx] = { ...brands[idx], name: e.target.value };
                          setForm((prev) => ({ ...prev, distributor: { ...prev.distributor, brands } }));
                        }}
                        placeholder="نام برند"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      {brand.logo ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-1">
                          <img src={toAbsoluteUploadUrl(brand.logo)} alt={brand.name} className="max-w-full max-h-full object-contain" />
                          <button onClick={() => {
                            const brands = [...form.distributor.brands];
                            brands[idx] = { ...brands[idx], logo: '' };
                            setForm((prev) => ({ ...prev, distributor: { ...prev.distributor, brands } }));
                          }}
                            className="absolute top-0.5 left-0.5 w-4 h-4 bg-danger/80 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-danger transition">×</button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-[10px]">لوگو</div>
                      )}
                      <label className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs cursor-pointer hover:bg-primary/20 transition whitespace-nowrap">
                        آپلود
                        <input type="file" accept="image/jpeg,image/png" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append('image', file);
                            try {
                              const { data: res } = await api.post('/upload/image', fd);
                              if (res?.url) {
                                const brands = [...form.distributor.brands];
                                brands[idx] = { ...brands[idx], logo: res.url };
                                setForm((prev) => ({ ...prev, distributor: { ...prev.distributor, brands } }));
                              }
                            } catch { /* ignore */ }
                          }} />
                      </label>
                    </div>
                    <button onClick={() => {
                      const brands = form.distributor.brands.filter((_, i) => i !== idx);
                      setForm((prev) => ({ ...prev, distributor: { ...prev.distributor, brands } }));
                    }}
                      className="text-danger text-sm hover:underline whitespace-nowrap">حذف</button>
                  </div>
                ))}
                <button onClick={() => {
                  const brands = [...form.distributor.brands, { name: '', logo: '' }];
                  setForm((prev) => ({ ...prev, distributor: { ...prev.distributor, brands } }));
                }}
                  className="text-primary text-sm hover:underline">+ افزودن برند</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">هزینه ارسال</label>
            <input type="number" name="shippingPrice" value={form.shippingPrice} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold mb-4">فروش ویژه / بنر بالای سایت</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="festivalActive" checked={form.festivalActive} onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
              <span className="text-sm">فعال (نمایش در صفحه اصلی)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" name="festivalTopBanner" checked={form.festivalTopBanner} onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
              <span className="text-sm">بنر بالای سایت</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">متن بنر</label>
                <input type="text" name="festivalTopBannerText" value={form.festivalTopBannerText} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">رنگ پس‌زمینه بنر</label>
                <input type="color" name="festivalBgColor" value={form.festivalBgColor} onChange={handleChange}
                  className="w-full h-9 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">عنوان</label>
                <input type="text" name="festivalTitle" value={form.festivalTitle} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">زیرعنوان</label>
                <input type="text" name="festivalSubtitle" value={form.festivalSubtitle} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">متن دکمه</label>
                <input type="text" name="festivalBtnText" value={form.festivalBtnText} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold mb-4">تنظیمات قیمت‌ها</h3>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="hidePrices" checked={form.hidePrices} onChange={handleChange}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
            <span className="text-sm">مخفی کردن قیمت‌ها (نمایش «برای اطلاع از قیمت تماس بگیرید»)</span>
          </label>
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
