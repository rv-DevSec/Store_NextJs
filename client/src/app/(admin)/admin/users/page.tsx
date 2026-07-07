'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, adminUpdateUser, adminDeleteUser } from '@/services/orderService';
import { formatDateTime } from '@/lib/utils/numbers';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-users'], queryFn: getAdminUsers });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) => adminUpdateUser(id, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = data?.users || [];

  const handleEditClick = (user: { _id: string; role: string }) => {
    setEditingId(user._id);
    setEditRole(user.role);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">کاربران</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-medium">نام</th>
                <th className="text-right px-4 py-3 font-medium">ایمیل</th>
                <th className="text-right px-4 py-3 font-medium">نقش</th>
                <th className="text-right px-4 py-3 font-medium">تاریخ عضویت</th>
                <th className="text-left px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: { _id: string; name: string; email: string; role: string; createdAt: string }) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    {editingId === user._id ? (
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs">
                        <option value="user">کاربر</option>
                        <option value="admin">مدیر</option>
                        <option value="seller">فروشنده</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${
                        user.role === 'admin' ? 'bg-primary/10 text-primary' :
                        user.role === 'seller' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role === 'admin' ? 'مدیر' : user.role === 'seller' ? 'فروشنده' : 'کاربر'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    {editingId === user._id ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => updateMutation.mutate({ id: user._id, updates: { role: editRole } })}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg">ذخیره</button>
                        <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">انصراف</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEditClick(user)} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition">ویرایش</button>
                        <button onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(user._id); }} className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">کاربری وجود ندارد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
