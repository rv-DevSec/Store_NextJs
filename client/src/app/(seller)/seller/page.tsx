'use client';

import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '@/services/orderService';
import { formatPrice, toPersianNumber } from '@/lib/utils/numbers';
import { useAuth } from '@/providers/AuthProvider';

const SellerDashboard = () => {
  const { user } = useAuth();
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats });

  const statCards = [
    { label: 'محصولات من', value: toPersianNumber(stats?.myProducts || 0), color: 'bg-primary/10 text-primary' },
    { label: 'فروش امروز', value: formatPrice(stats?.todaySales || 0), color: 'bg-success/10 text-success' },
    { label: 'سفارشات', value: toPersianNumber(stats?.myOrders || 0), color: 'bg-info/10 text-info' },
    { label: 'در انتظار پردازش', value: toPersianNumber(stats?.pendingSellerOrders || 0), color: 'bg-warning/10 text-warning' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">داشبورد فروشنده</h1>
      <p className="text-sm text-gray-500 mb-6">خوش آمدید، {user?.name}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-200">
            <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium mb-2 ${card.color}`}>{card.label}</div>
            <p className="text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerDashboard;
