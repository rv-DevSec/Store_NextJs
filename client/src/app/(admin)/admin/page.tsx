'use client';

import { useQuery } from '@tanstack/react-query';
import { getAdminStats, getAdminOrders, getAdminProducts } from '@/services/orderService';
import { formatPrice, toPersianNumber } from '@/lib/utils/numbers';
import Link from 'next/link';

const AdminDashboard = () => {
  const { data: statsData } = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats });
  const { data: recentOrders } = useQuery({ queryKey: ['admin-orders-recent'], queryFn: () => getAdminOrders({ limit: '5', page: '1' }) });
  const { data: lowStock } = useQuery({ queryKey: ['admin-products-low-stock'], queryFn: getAdminProducts });

  const stats = statsData?.stats;

  const statCards = [
    { label: 'کل فروش', value: formatPrice(stats?.totalSales || 0), href: '/admin/orders', color: 'bg-primary/10 text-primary' },
    { label: 'سفارشات امروز', value: toPersianNumber(stats?.todayOrders || 0), href: '/admin/orders', color: 'bg-success/10 text-success' },
    { label: 'کاربران', value: toPersianNumber(stats?.totalUsers || 0), href: '/admin/users', color: 'bg-info/10 text-info' },
    { label: 'محصولات', value: toPersianNumber(stats?.totalProducts || 0), href: '/admin/products', color: 'bg-warning/10 text-warning' },
    { label: 'سفارشات در انتظار', value: toPersianNumber(stats?.pendingOrders || 0), href: '/admin/orders', color: 'bg-danger/10 text-danger' },
    { label: 'فروشندگان', value: toPersianNumber(stats?.totalSellers || 0), href: '/admin/sellers', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">داشبورد</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
            <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium mb-2 ${card.color}`}>{card.label}</div>
            <p className="text-xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">سفارشات اخیر</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">مشاهده همه</Link>
          </div>
          <div className="space-y-2">
            {recentOrders?.orders?.slice(0, 5).map((order: { _id: string; createdAt: string; totalAmount: number; status: string; user?: { name: string } }) => (
              <Link key={order._id} href={`/admin/orders`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-medium">{order.user?.name || 'کاربر'}</p>
                  <p className="text-xs text-gray-500">{formatPrice(order.totalAmount)}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg bg-gray-100">{order.status}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">محصولات کم موجودی</h2>
            <Link href="/admin/products" className="text-sm text-primary hover:underline">مشاهده همه</Link>
          </div>
          <div className="space-y-2">
            {lowStock?.products?.filter((p: { stock: number }) => p.stock <= 5).slice(0, 5).map((product: { _id: string; name: string; stock: number; price: number }) => (
              <Link key={product._id} href={`/admin/products`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">{product.name}</p>
                  <p className="text-xs text-gray-500">{formatPrice(product.price)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg ${product.stock === 0 ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                  {toPersianNumber(product.stock)} عدد
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
