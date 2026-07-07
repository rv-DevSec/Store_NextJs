'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCreateCategory, adminUpdateCategory, adminDeleteCategory, uploadImage } from '@/services/orderService';
import { getCategories } from '@/services/productService';

const EMOJIS = ['🔧', '🚗', '⚙️', '🔩', '🛞', '🛢️', '🔋', '🏎️', '📦', '🚚', '🧰', '🛠️', '⛽', '🔌', '🪫', '🧽', '💡', '🪞', '🪟', '🔊'];

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: adminCreateCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setName(''); setSlug(''); setIcon(''); },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: Record<string, unknown> }) => adminUpdateCategory(id, category),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setName(''); setSlug(''); setIcon(''); setEditingId(null); },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const categories = data?.categories || [];

  const handleSubmit = () => {
    setError('');
    if (!name.trim() || !slug.trim()) {
      setError('نام و slug الزامی هستند');
      return;
    }
    const payload: Record<string, unknown> = { name: name.trim(), slug: slug.trim() };
    if (icon) payload.icon = icon;
    if (editingId) {
      updateMutation.mutate({ id: editingId, category: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (cat: { _id: string; name: string; slug: string; icon?: string }) => {
    setEditingId(cat._id);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || '');
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setIcon('');
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadImage(file);
      if (res.url) setIcon(res.url);
    } catch {
      setError('خطا در آپلود آیکون');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">دسته‌بندی‌ها</h1>

      {error && <p className="text-xs text-danger mb-2">{error}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="نام دسته‌بندی" className="flex-1 min-w-[160px] px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary" />
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
          placeholder="slug" className="w-36 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary" dir="ltr" />
        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-xl text-lg hover:bg-gray-50 transition">
              {icon && !icon.startsWith('/uploads/') ? icon : '😀'}
            </button>
            {showEmojiPicker && (
              <div className="absolute top-full right-0 mt-1 z-10 bg-white border border-gray-200 rounded-xl p-2 shadow-lg grid grid-cols-5 gap-1 w-56">
                {EMOJIS.map((emoji) => (
                  <button key={emoji} onClick={() => { setIcon(emoji); setShowEmojiPicker(false); }}
                    className={`w-9 h-9 flex items-center justify-center text-lg rounded-lg hover:bg-gray-100 transition ${icon === emoji ? 'bg-primary/10 ring-2 ring-primary' : ''}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <label className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition">
            🖼️
            <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
        <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !(name || '').trim() || !(slug || '').trim()}
          className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
          {editingId ? 'ویرایش' : 'افزودن'}
        </button>
        {editingId && (
          <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition">انصراف</button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {categories.map((cat: { _id: string; name: string; slug: string; icon?: string }) => (
          <div key={cat._id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              {cat.icon ? (
                cat.icon.startsWith('/uploads/')
                  ? <img src={cat.icon} alt="" className="w-8 h-8 object-contain rounded" />
                  : <span className="text-xl">{cat.icon}</span>
              ) : (
                <span className="text-xl text-gray-300">📦</span>
              )}
              <div>
                <span className="text-sm font-medium">{cat.name}</span>
                <span className="text-xs text-gray-400 mr-2" dir="ltr">{cat.slug}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(cat)} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition">ویرایش</button>
              <button onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(cat._id); }} className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="text-center py-8 text-gray-500 text-sm">دسته‌بندی‌ای وجود ندارد</p>}
      </div>
    </div>
  );
};

export default AdminCategories;
