'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toAbsoluteUploadUrl } from '@/lib/utils/uploadUrl';

const FaviconInjector = () => {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data: res } = await api.get('/settings'); return res; },
    staleTime: 300_000,
  });

  const favicon = (data?.settings?.favicon as string) || '';

  useEffect(() => {
    if (!favicon) return;
    const href = toAbsoluteUploadUrl(favicon);
    if (!href) return;
    let updated = false;
    document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']").forEach((link) => {
      link.href = href;
      updated = true;
    });
    if (!updated) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = href;
      document.head.appendChild(link);
    }
  }, [favicon]);

  return null;
};

export default FaviconInjector;
