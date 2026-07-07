'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import SEO from '@/components/common/SEO';

const PaymentResultContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('Status');
  const authority = searchParams.get('Authority');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (status === 'OK' && authority && orderId) {
      api.put(`/orders/${orderId}/payment-info`, {
        'paymentInfo.authority': authority,
        paymentStatus: 'paid',
      }).catch(() => {});
    }
  }, [status, authority, orderId]);

  const isSuccess = status === 'OK';

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <SEO title={isSuccess ? 'پرداخت موفق' : 'پرداخت ناموفق'} />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-slide-up">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-success mb-2">پرداخت موفق</h1>
            <p className="text-gray-500 text-sm mb-6">پرداخت شما با موفقیت انجام شد</p>
            {orderId && (
              <p className="text-xs text-gray-400 mb-6">کد سفارش: {orderId.slice(-8).toUpperCase()}</p>
            )}
            <div className="flex gap-3 justify-center">
              <Link href="/orders" className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition">
                مشاهده سفارشات
              </Link>
              <Link href="/products" className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                ادامه خرید
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-danger mb-2">پرداخت ناموفق</h1>
            <p className="text-gray-500 text-sm mb-6">پرداخت شما با خطا مواجه شد. لطفاً مجدداً تلاش کنید</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.back()} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition">
                تلاش مجدد
              </button>
              <Link href="/products" className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                بازگشت به فروشگاه
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PaymentResult = () => {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
};

export default PaymentResult;
