'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils/cn';
import { toAbsoluteUploadUrl } from '@/lib/utils/uploadUrl';

const SOCIAL_LABELS: Record<string, string> = { telegram: 'تلگرام', rubika: 'روبیکا', bale: 'بله' };

const DEFAULT_ICONS: Record<string, React.ReactNode> = {
  telegram: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  rubika: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
    </svg>
  ),
  bale: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
    </svg>
  ),
};

const ContactWidget = () => {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data: res } = await api.get('/settings'); return res; },
    staleTime: 300_000,
  });
  const socials = (data?.settings?.socials || {}) as Record<string, { active: boolean; link: string; icon: string }>;
  const activeSocials = Object.entries(socials).filter(([, v]) => v.active && v.link);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  if (activeSocials.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-end gap-2" dir="ltr">
      {open && (
        <div className="flex flex-col gap-2 animate-fade-in">
          {activeSocials.map(([name, cfg]) => (
            <a
              key={name}
              href={cfg.link}
              target="_blank"
              rel="noopener noreferrer"
              title={SOCIAL_LABELS[name] || name}
              className="w-11 h-11 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center bg-white text-gray-700 border border-gray-200 hover:border-primary hover:text-primary"
            >
              {cfg.icon ? (
                <img src={toAbsoluteUploadUrl(cfg.icon)} alt={SOCIAL_LABELS[name]} className="w-6 h-6 object-contain" />
              ) : (
                DEFAULT_ICONS[name]
              )}
            </a>
          ))}
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={cn(
          'w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95',
          open ? 'bg-danger text-white' : 'bg-primary text-white'
        )}
        title="پشتیبانی"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ContactWidget;
