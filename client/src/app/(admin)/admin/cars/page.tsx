'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCreateCar, adminUpdateCar, adminDeleteCar } from '@/services/orderService';
import { getCars } from '@/services/productService';

const AdminCars = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['cars'], queryFn: getCars });
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

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

  const cars = data?.cars || [];

  const handleSubmit = () => {
    setError('');
    if (!name.trim()) {
      setError('نام خودرو الزامی است');
      return;
    }
    const parts = name.trim().split(/\s+/);
    const carBrand = parts[0];
    const carModel = parts.slice(1).join(' ') || parts[0];
    const payload: Record<string, unknown> = { brand: carBrand, model: carModel };
    if (editingId) {
      updateMutation.mutate({ id: editingId, car: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (car: { _id: string; brand: string; model: string }) => {
    setEditingId(car._id);
    setName(`${car.brand} ${car.model}`.trim());
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
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

      <div className="bg-white rounded-xl border border-gray-200">
        {cars.map((car: { _id: string; brand: string; model: string }) => (
          <div key={car._id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition">
            <span className="text-sm font-medium">{car.brand}{car.model !== car.brand ? ` ${car.model}` : ''}</span>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(car)} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition">ویرایش</button>
              <button onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(car._id); }} className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
            </div>
          </div>
        ))}
        {cars.length === 0 && <p className="text-center py-8 text-gray-500 text-sm">خودرویی وجود ندارد</p>}
      </div>
    </div>
  );
};

export default AdminCars;
