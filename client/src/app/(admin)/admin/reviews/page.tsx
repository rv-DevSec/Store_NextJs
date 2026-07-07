'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminReviews, approveReview, rejectReview, adminDeleteReview } from '@/services/orderService';
import { formatDateTime } from '@/lib/utils/numbers';

const AdminReviews = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-reviews'], queryFn: getAdminReviews });

  const approveMutation = useMutation({
    mutationFn: approveReview,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectReview,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteReview,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const reviews = data?.reviews || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">نظرات</h1>

      <div className="space-y-4">
        {reviews.map((review: { _id: string; user?: { name: string }; product?: { name: string }; rating: number; comment: string; status: string; createdAt: string }) => (
          <div key={review._id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm">{review.user?.name || 'کاربر'}</p>
                <p className="text-xs text-gray-500">برای: {review.product?.name || 'محصول'}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-lg ${
                review.status === 'approved' ? 'bg-success/10 text-success' :
                review.status === 'rejected' ? 'bg-danger/10 text-danger' :
                'bg-warning/10 text-warning'
              }`}>
                {review.status === 'approved' ? 'تایید شده' : review.status === 'rejected' ? 'رد شده' : 'در انتظار'}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-gray-600 mb-3">{review.comment}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{formatDateTime(review.createdAt)}</span>
              <div className="flex gap-2">
                {review.status === 'pending' && (
                  <button onClick={() => approveMutation.mutate(review._id)}
                    className="text-xs px-3 py-1 bg-success/10 text-success rounded-lg hover:bg-success/20 transition">تایید</button>
                )}
                {review.status === 'approved' && (
                  <button onClick={() => rejectMutation.mutate(review._id)}
                    className="text-xs px-3 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">رد</button>
                )}
                <button onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(review._id); }}
                  className="text-xs px-3 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition">حذف</button>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-center py-8 text-gray-500">نظری وجود ندارد</p>}
      </div>
    </div>
  );
};

export default AdminReviews;
