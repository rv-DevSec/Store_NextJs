'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils/numbers';

const statusColors: Record<string, string> = {
  success: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
};

const statusLabels: Record<string, string> = {
  success: 'موفق',
  failed: 'ناموفق',
};

const roleLabels: Record<string, string> = {
  admin: 'مدیر',
  user: 'کاربر',
  seller: 'فروشنده',
};

const AdminLoginLogs = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-login-logs', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const { data: res } = await api.get(`/admin/login-logs?${params}`);
      return res;
    },
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">لاگ ورود</h1>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500">فیلتر وضعیت:</span>
        {['', 'success', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'همه' : statusLabels[s] || s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-center py-12 text-gray-500">لاگی یافت نشد</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-right font-medium text-gray-600">ایمیل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">نقش</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">وضعیت</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">علت</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">IP</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">مرورگر</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: { _id: string; email: string; role: string; status: string; failReason: string; ip: string; userAgent: string; createdAt: string }) => (
                <tr key={log._id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{log.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{roleLabels[log.role] || log.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[log.status] || log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{log.failReason || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap" dir="ltr">{log.ip || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" dir="ltr">{log.userAgent || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition disabled:opacity-40"
          >
            قبلی
          </button>
          <span className="text-sm text-gray-500">
            {pagination.page} از {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminLoginLogs;
