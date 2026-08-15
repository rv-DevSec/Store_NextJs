'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCreateCar, adminUpdateCar, adminDeleteCar, adminReorderCars } from '@/services/orderService';
import { getCars } from '@/services/productService';
import api from '@/lib/api';
import { toAbsoluteUploadUrl } from '@/lib/utils/uploadUrl';

const AdminCars = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['cars'], queryFn: getCars });
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cars = data?.cars || [];
  const apiOrder = cars.map((c: { _id: string }) => c._id);

  const localIdSetKey = [...orderIds].sort().join(',');
  const apiIdSetKey = [...apiOrder].sort().join(',');
  if (apiOrder.length > 0 && localIdSetKey !== apiIdSetKey) {
    setOrderIds(apiOrder);
  }

  const carsById = new Map<string, { _id: string; brand: string; model: string; image?: string }>(
    cars.map((c: { _id: string; brand: string; model: string; image?: string }) => [c._id, c])
  );
  const orderedCars = orderIds
    .map((id) => carsById.get(id))
    .filter((c): c is { _id: string; brand: string; model: string; image?: string } => Boolean(c));
  const orderChanged = orderIds.length > 0 && orderIds.join(',') !== apiOrder.join(',');

  const moveCar = (index: number, dir: -1 | 1) => {
    setOrderIds((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSaveOrder = async () => {
    if (!orderChanged || orderIds.length === 0) return;
    setSavingOrder(true);
    setError('');
    setOrderMessage('');
    try {
      await adminReorderCars(orderIds);
      setOrderMessage('ترتیب خودروها ذخیره شد');
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ذخیره ترتیب';
      setError(msg);
    } finally {
      setSavingOrder(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: adminCreateCar,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cars'] }); setName(''); },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, car }: { id: string; car: Record<string, unknown> }) => adminUpdateCar(id, car),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cars'] }); setName(''); setEditingId(null); },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteCar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cars'] }),
  });

  const handleSubmit = () => {
    setError('');
    if (!name.trim()) {
      setError('نام خودرو الزامی است');
      return;
    }
    const parts = name.trim().split(/\s+/);
    const carBrand = parts.length > 1 ? parts[0] : parts[0];
    const carModel = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
    const payload: Record<string, unknown> = { brand: carBrand, model: carModel };
    if (editingId) {
      updateMutation.mutate({ id: editingId, car: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (car: { _id: string; brand: string; model: string }) => {
    setEditingId(car._id);
    setName(car.brand && car.brand !== car.model ? `${car.brand} ${car.model}`.trim() : car.model);
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
  };

  const handleImageUpload = async (carId: string, file: File) => {
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      await api.put(`/admin/cars/${carId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در آپلود تصویر';
      setError(msg);
    }
  };

  const handleRemoveImage = async (carId: string) => {
    setError('');
    try {
      await api.put(`/admin/cars/${carId}`, { image: '' });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در حذف تصویر';
      setError(msg);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">خودروها</h1>

      {error && <p className="text-xs text-danger mb-2">{error}</p>}

      <div className="flex gap-2 mb-6">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="نام خودرو (مثال: BMW X5)" className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary" />
        <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !(name || '').trim()}
          className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
          {editingId ? 'ویرایش' : 'افزودن'}
        </button>
        {editingId && (
          <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition">انصراف</button>
        )}
      </div>

      {orderChanged && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-700">ترتیب نمایش تغییر کرده است</p>
          <button onClick={handleSaveOrder} disabled={savingOrder}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
            {savingOrder ? 'در حال ذخیره...' : 'ذخیره ترتیب'}
          </button>
        </div>
      )}
      {orderMessage && <p className="text-xs text-success mb-2">{orderMessage}</p>}

      <div className="bg-white rounded-xl border border-gray-200">
        {orderedCars.map((car: { _id: string; brand: string; model: string; image?: string }, index: number) => (
          <div key={car._id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition gap-3">
            <div className="flex flex-col items-center gap-1 flex-shrink-0" title="ترتیب نمایش">
              <button onClick={() => moveCar(index, -1)} disabled={index === 0}
                className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-600 flex items-center justify-center">▲</button>
              <span className="text-[11px] text-gray-400">{index + 1}</span>
              <button onClick={() => moveCar(index, 1)} disabled={index === orderedCars.length - 1}
                className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-600 flex items-center justify-center">▼</button>
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {car.image ? (
                  <img src={toAbsoluteUploadUrl(car.image)} alt="" className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l6-4 6 4m-12 0v6a2 2 0 002 2h8a2 2 0 002-2v-6M5 10l6 4 6-4" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium truncate">{car.brand}{car.model !== car.brand ? ` ${car.model}` : ''}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <label className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition cursor-pointer">
                تصویر
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(car._id, file);
                    e.target.value = '';
                  }}
                />
              </label>
              {car.image && (
                <button onClick={() => handleRemoveImage(car._id)} className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition">حذف تصویر</button>
              )}
              <button onClick={() => handleEdit(car)} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition">ویرایش</button>
              <button onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(car._id); }} className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
            </div>
          </div>
        ))}
        {orderedCars.length === 0 && <p className="text-center py-8 text-gray-500 text-sm">خودرویی وجود ندارد</p>}
      </div>
    </div>
  );
};

export default AdminCars;