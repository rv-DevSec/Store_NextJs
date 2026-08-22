'use client';

import { useState, useRef } from 'react';
import { downloadBackup, previewBackupFile, restoreBackup } from '@/services/orderService';
import { toPersianNumber } from '@/lib/utils/numbers';

const collections = [
  { key: 'products', label: 'محصولات', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { key: 'orders', label: 'سفارشات', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { key: 'users', label: 'کاربران', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
] as const;

interface PreviewResult {
  version: string;
  exportedAt: string | null;
  collections: Record<string, number>;
}

const BackupPage = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewCollection, setPreviewCollection] = useState<string>('');
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleDownload = async (collection: string) => {
    setDownloading(collection);
    setResult(null);
    try {
      await downloadBackup(collection);
      setResult({ type: 'success', message: `پشتیبان ${collection === 'all' ? 'همه داده‌ها' : collections.find((c) => c.key === collection)?.label || collection} دانلود شد` });
    } catch {
      setResult({ type: 'error', message: 'خطا در دانلود پشتیبان' });
    } finally {
      setDownloading(null);
    }
  };

  const handleFileSelect = async (collection: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(collection);
    setResult(null);
    setPreview(null);
    setPreviewFile(file);
    setPreviewCollection(collection);
    try {
      const res = await previewBackupFile(file);
      setPreview(res);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در خواندن فایل';
      setResult({ type: 'error', message: msg });
      setPreviewFile(null);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handleRestore = async () => {
    if (!previewFile || !previewCollection) return;
    if (!confirm('آیا از بازیابی این اطلاعات اطمینان دارید؟ داده‌های موجود ممکن است بروزرسانی شوند.')) return;
    setRestoreLoading(true);
    setResult(null);
    try {
      const res = await restoreBackup(previewCollection, previewFile);
      setResult({ type: 'success', message: res.message || 'بازیابی با موفقیت انجام شد' });
      setPreview(null);
      setPreviewFile(null);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در بازیابی';
      setResult({ type: 'error', message: msg });
    } finally {
      setRestoreLoading(false);
    }
  };

  const cancelPreview = () => {
    setPreview(null);
    setPreviewFile(null);
    setPreviewCollection('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">پشتیبان‌گیری و بازیابی</h1>

      {result && (
        <div className={`border rounded-xl px-4 py-3 text-sm mb-6 ${
          result.type === 'success' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
        }`}>
          {result.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Download Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            دانلود پشتیبان
          </h2>
          <p className="text-sm text-gray-500 mb-4">فایل JSON حاوی تمام اطلاعات هر مجموعه را دانلود کنید.</p>

          <div className="space-y-3">
            {collections.map((col) => (
              <button
                key={col.key}
                onClick={() => handleDownload(col.key)}
                disabled={downloading !== null}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-right"
              >
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={col.icon} />
                </svg>
                <span className="flex-1 text-sm font-medium">{col.label}</span>
                {downloading === col.key ? (
                  <span className="text-xs text-gray-400">در حال دانلود...</span>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
              </button>
            ))}

            <div className="border-t border-gray-200 pt-3 mt-3">
              <button
                onClick={() => handleDownload('all')}
                disabled={downloading !== null}
                className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 text-right"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="flex-1 text-sm font-medium">دانلود همه (محصولات + سفارشات + کاربران)</span>
                {downloading === 'all' && <span className="text-xs opacity-80">در حال دانلود...</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Restore Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            بازیابی از فایل پشتیبان
          </h2>
          <p className="text-sm text-gray-500 mb-4">فایل JSON پشتیبان را آپلود کنید. داده‌ها بر اساس شناسه بروزرسانی یا ایجاد می‌شوند.</p>

          <div className="space-y-3">
            {collections.map((col) => (
              <div key={col.key}>
                <label className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer text-right">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={col.icon} />
                  </svg>
                  <span className="flex-1 text-sm font-medium">{col.label}</span>
                  {uploading === col.key ? (
                    <span className="text-xs text-gray-400">در حال آپلود...</span>
                  ) : (
                    <span className="text-xs text-gray-400">انتخاب فایل</span>
                  )}
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    disabled={uploading !== null}
                    onChange={(e) => handleFileSelect(col.key, e)}
                    ref={(el) => { fileRefs.current[col.key] = el; }}
                  />
                </label>
              </div>
            ))}
          </div>

          {preview && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-sm mb-2">پیش‌نمایش فایل پشتیبان</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>نسخه: <span className="font-medium">{preview.version}</span></p>
                {preview.exportedAt && (
                  <p>تاریخ خروجی: <span className="font-medium">{new Date(preview.exportedAt).toLocaleDateString('fa-IR')}</span></p>
                )}
                <div className="mt-2">
                  <p className="font-medium mb-1">مجموعه‌ها:</p>
                  {Object.entries(preview.collections).map(([key, count]) => (
                    <p key={key} className="mr-2">
                      {collections.find((c) => c.key === key)?.label || key}: <span className="font-bold">{toPersianNumber(count)}</span> رکورد
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleRestore}
                  disabled={restoreLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {restoreLoading ? 'در حال بازیابی...' : 'تأیید و بازیابی'}
                </button>
                <button
                  onClick={cancelPreview}
                  disabled={restoreLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupPage;
