'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">!</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">خطایی رخ داده است</h2>
        <p className="text-gray-500 mb-4">متأسفانه در پردازش درخواست شما مشکلی پیش آمده است</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition"
        >
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}
