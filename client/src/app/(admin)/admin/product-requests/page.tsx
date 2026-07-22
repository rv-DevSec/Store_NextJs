'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateTime, toPersianNumber } from '@/lib/utils/numbers';

const statusLabels: Record<string, string> = {
  pending: 'در انتظار',
  contacted: 'تماس گرفته شد',
  resolved: 'انجام شد',
};

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  contacted: 'bg-blue-50 text-blue-700',
  resolved: 'bg-success/10 text-success',
};

const AdminProductRequests = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingNote, setEditingNote] = useState<{ id: string; note: string } | null>(null);

  const queryKey = ['admin-product-requests', statusFilter, page];

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const { data: res } = await api.get(`/product-requests?${params.toString()}`);
      return res;
    },
  });

  const requests = data?.requests || [];
  const totalPages = data?.pagination?.pages || 1;

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: string; status?: string; adminNote?: string }) => {
      const { data: res } = await api.put(`/product-requests/${id}`, { status, adminNote });
      return res;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: res } = await api.delete(`/product-requests/${id}`);
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">درخواست محصولات</h1>

      <div className="flex items-center gap-3 mb-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary">
          <option value="">همه</option>
          <option value="pending">در انتظار</option>
          <option value="contacted">تماس گرفته شد</option>
          <option value="resolved">انجام شد</option>
        </select>
        <span className="text-sm text-gray-500">{toPersianNumber(data?.pagination?.total || 0)} درخواست</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-medium">نام</th>
                <th className="text-right px-4 py-3 font-medium">شماره تماس</th>
                <th className="text-right px-4 py-3 font-medium">نام محصول</th>
                <th className="text-right px-4 py-3 font-medium">توضیحات</th>
                <th className="text-right px-4 py-3 font-medium">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium">یادداشت</th>
                <th className="text-right px-4 py-3 font-medium">تاریخ</th>
                <th className="text-left px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: { _id: string; name: string; phone: string; productName: string; description?: string; status: string; adminNote?: string; createdAt: string }) => (
                <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3" dir="ltr">{r.phone}</td>
                  <td className="px-4 py-3">{r.productName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">{r.description || '—'}</td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={(e) => updateMutation.mutate({ id: r._id, status: e.target.value })}
                      className={`px-2 py-1 border rounded text-xs font-medium ${statusColors[r.status] || ''}`}>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key} className="text-gray-800 bg-white">{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {editingNote?.id === r._id ? (
                      <div className="flex gap-1">
                        <input type="text" value={editingNote.note} onChange={(e) => setEditingNote({ ...editingNote, note: e.target.value })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-xs" />
                        <button onClick={() => { updateMutation.mutate({ id: r._id, adminNote: editingNote.note }); setEditingNote(null); }}
                          className="text-xs text-primary">ذخیره</button>
                      </div>
                    ) : (
                      <span onClick={() => setEditingNote({ id: r._id, note: r.adminNote || '' })}
                        className="text-xs text-gray-500 cursor-pointer hover:text-primary transition">
                        {r.adminNote || '➕'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-left">
                    <a href={`tel:${r.phone}`}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition ml-1">تماس</a>
                    <button onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(r._id); }}
                      className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">درخواستی وجود ندارد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition">قبلی</button>
          <span className="px-3 py-1.5 text-sm">{toPersianNumber(page)} از {toPersianNumber(totalPages)}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition">بعدی</button>
        </div>
      )}
    </div>
  );
};

export default AdminProductRequests;
