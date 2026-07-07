'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct, adminDuplicateProduct, uploadImages } from '@/services/orderService';
import { getCategories, getCars } from '@/services/productService';
import { formatPrice, toPersianNumber } from '@/lib/utils/numbers';

const emptySpec = { key: '', value: '' };

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', price: '', discountPrice: '', stock: '', category: '',
    compatibleCars: [] as string[], description: '', specs: [] as { key: string; value: string }[],
    images: [] as string[], newImages: [] as string[],
  });
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState('');
  const [inlineMasterPrice, setInlineMasterPrice] = useState('');
  const [inlineStock, setInlineStock] = useState('');

  const { data } = useQuery({ queryKey: ['admin-products'], queryFn: getAdminProducts });
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: carsData } = useQuery({ queryKey: ['cars'], queryFn: getCars });

  const createMutation = useMutation({
    mutationFn: adminCreateProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); resetForm(); },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, product }: { id: string; product: Record<string, unknown> }) => adminUpdateProduct(id, product),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); resetForm(); },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
    onError: (err: Error) => { setError(err.message); alert('خطا در حذف محصول: ' + err.message); },
  });

  const duplicateMutation = useMutation({
    mutationFn: adminDuplicateProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const inlineUpdateMutation = useMutation({
    mutationFn: ({ id, product }: { id: string; product: Record<string, unknown> }) => adminUpdateProduct(id, product),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setInlineEditId(null); },
  });

  const products = data?.products || [];
  const categories = categoriesData?.categories || [];
  const cars = carsData?.cars || [];

  const filtered = products.filter((p: { name: string }) => p.name.includes(searchTerm));

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError('');
    setForm({ name: '', slug: '', price: '', discountPrice: '', stock: '', category: '', compatibleCars: [], description: '', specs: [], images: [], newImages: [] });
  };

  const handleEdit = (product: Record<string, unknown>) => {
    const cat = product.category as Record<string, unknown> | string | undefined;
    const catId = typeof cat === 'object' && cat ? (cat._id as string) : (cat as string) || '';
    const carList = (product.compatibleCars as Array<Record<string, unknown> | string> || []).map((c) => typeof c === 'object' ? c._id as string : c);
    const rawSpecs = product.specs as Record<string, string> | undefined;
    const specList = rawSpecs ? Object.entries(rawSpecs).map(([key, value]) => ({ key, value })) : [];
    setEditingId(product._id as string);
    setForm({
      name: product.name as string || '',
      slug: product.slug as string || '',
      price: String(product.price || ''),
      discountPrice: String(product.discountPrice || ''),
      stock: String(product.stock || ''),
      category: catId,
      compatibleCars: carList,
      description: product.description as string || '',
      specs: specList,
      images: Array.isArray(product.images) ? product.images : [],
      newImages: [],
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadImages(Array.from(files));
      const urls = (res.images || []).map((img: { url: string }) => img.url);
      setForm((p) => ({ ...p, newImages: [...p.newImages, ...urls] }));
    } catch {
      setError('خطا در آپلود تصاویر');
    } finally {
      setUploading(false);
    }
  };

  const addSpec = () => setForm((p) => ({ ...p, specs: [...p.specs, { key: '', value: '' }] }));

  const updateSpec = (idx: number, field: 'key' | 'value', val: string) => {
    setForm((p) => {
      const specs = [...p.specs];
      specs[idx] = { ...specs[idx], [field]: val };
      return { ...p, specs };
    });
  };

  const removeSpec = (idx: number) => {
    setForm((p) => ({ ...p, specs: p.specs.filter((_, i) => i !== idx) }));
  };

  const removeImage = (url: string) => {
    setForm((p) => ({ ...p, images: p.images.filter((img) => img !== url) }));
  };

  const removeNewImage = (url: string) => {
    setForm((p) => ({ ...p, newImages: p.newImages.filter((img) => img !== url) }));
  };

  const toggleCar = (carId: string) => {
    setForm((p) => ({
      ...p,
      compatibleCars: p.compatibleCars.includes(carId)
        ? p.compatibleCars.filter((id) => id !== carId)
        : [...p.compatibleCars, carId],
    }));
  };

  const handleSubmit = () => {
    setError('');
    if (!form.name || !form.slug || !form.price || !form.stock || !form.category) {
      setError('نام، اسلاگ، قیمت، موجودی و دسته‌بندی الزامی هستند');
      return;
    }
    const specsObj: Record<string, string> = {};
    form.specs.forEach((s) => { if (s.key) specsObj[s.key] = s.value; });
    const productData: Record<string, unknown> = {
      name: form.name,
      slug: form.slug,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      description: form.description,
      specs: Object.keys(specsObj).length > 0 ? specsObj : undefined,
    };
    if (form.discountPrice) productData.discountPrice = Number(form.discountPrice);
    if (form.compatibleCars.length > 0) productData.compatibleCars = form.compatibleCars;
    const allImages = [...form.images, ...form.newImages];
    if (allImages.length > 0) productData.images = allImages;
    if (editingId) {
      updateMutation.mutate({ id: editingId, product: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">محصولات</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition">
          + محصول جدید
        </button>
      </div>

      <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="جستجوی محصول..." className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm mb-4 focus:outline-none focus:border-primary" />

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-bold">{editingId ? 'ویرایش محصول' : 'محصول جدید'}</h2>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">نام محصول *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">اسلاگ *</label>
              <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">قیمت *</label>
              <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">قیمت تخفیف</label>
              <input type="number" value={form.discountPrice} onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">موجودی *</label>
              <input type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">دسته‌بندی *</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="">انتخاب کنید</option>
                {categories.map((c: { _id: string; name: string }) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">توضیحات</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">مشخصات</label>
            <div className="space-y-2">
              {form.specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" placeholder="عنوان" value={spec.key}
                    onChange={(e) => updateSpec(idx, 'key', e.target.value)}
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                  <input type="text" placeholder="مقدار" value={spec.value}
                    onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                  <button onClick={() => removeSpec(idx)} className="text-danger text-sm hover:underline">حذف</button>
                </div>
              ))}
              <button onClick={addSpec} className="text-sm text-primary hover:underline">+ افزودن مشخصه</button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">تصاویر</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {form.images.map((url) => (
                <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(url)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-danger text-white rounded-full text-xs flex items-center justify-center">×</button>
                </div>
              ))}
              {form.newImages.map((url) => (
                <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeNewImage(url)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-danger text-white rounded-full text-xs flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {uploading ? 'در حال آپلود...' : 'انتخاب تصاویر'}
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">خودروهای سازگار</label>
            <div className="flex flex-wrap gap-2">
              {cars.map((c: { _id: string; brand: string; model: string }) => (
                <button key={c._id} onClick={() => toggleCar(c._id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${form.compatibleCars.includes(c._id) ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:border-gray-400'}`}>
                  {c.brand} {c.model}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || uploading}
              className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
              {editingId ? 'ویرایش' : 'ایجاد'}
            </button>
            <button onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">انصراف</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-medium">محصول</th>
                <th className="text-right px-4 py-3 font-medium">قیمت فروش</th>
                <th className="text-right px-4 py-3 font-medium">قیمت پایه فروشنده</th>
                <th className="text-right px-4 py-3 font-medium">موجودی</th>
                <th className="text-right px-4 py-3 font-medium">دسته‌بندی</th>
                <th className="text-left px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product: { _id: string; name: string; price: number; discountPrice?: number; masterPrice?: number; stock: number; category?: { name: string }; images?: string[] }) => (
                <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {inlineEditId === product._id ? (
                      <div className="flex flex-col gap-1">
                        <input type="number" value={inlinePrice} onChange={(e) => setInlinePrice(e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded text-xs" placeholder="قیمت فروش" />
                        {product.discountPrice && (
                          <span className="text-xs text-gray-400">تخفیف: {formatPrice(product.discountPrice)}</span>
                        )}
                      </div>
                    ) : (
                      product.discountPrice ? (
                        <div>
                          <span className="text-danger font-medium">{formatPrice(product.discountPrice)}</span>
                          <span className="text-xs text-gray-400 line-through mr-2">{formatPrice(product.price)}</span>
                        </div>
                      ) : formatPrice(product.price)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inlineEditId === product._id ? (
                      <input type="number" value={inlineMasterPrice} onChange={(e) => setInlineMasterPrice(e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-xs" />
                    ) : (
                      <span className="text-gray-600">{product.masterPrice ? formatPrice(product.masterPrice) : '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inlineEditId === product._id ? (
                      <input type="number" value={inlineStock} onChange={(e) => setInlineStock(e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-xs" />
                    ) : (
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${product.stock > 5 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {toPersianNumber(product.stock)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{product.category?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {inlineEditId === product._id ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => inlineUpdateMutation.mutate({ id: product._id, product: { price: Number(inlinePrice), masterPrice: Number(inlineMasterPrice) || 0, stock: Number(inlineStock) } })}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg">ذخیره</button>
                        <button onClick={() => setInlineEditId(null)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">انصراف</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setInlineEditId(product._id); setInlinePrice(String(product.price ?? '')); setInlineMasterPrice(String(product.masterPrice ?? '')); setInlineStock(String(product.stock)); }}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition">ویرایش قیمت</button>
                        <button onClick={() => handleEdit(product)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">ویرایش کامل</button>
                        <button onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(product._id); }} className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
                        <button onClick={() => duplicateMutation.mutate(product._id)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">کپی</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">محصولی یافت نشد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
