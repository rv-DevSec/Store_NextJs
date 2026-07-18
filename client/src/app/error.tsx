'use client';

import { useEffect } from 'react';

export default function RootError({
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">!</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">خطایی رخ داده است</h1>
        <p className="text-gray-500 mb-6">متأسفانه در پردازش درخواست شما مشکلی پیش آمده است</p>
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
