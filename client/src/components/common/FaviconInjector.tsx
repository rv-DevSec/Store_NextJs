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
    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    const href = toAbsoluteUploadUrl(favicon);
    if (href) link.href = href;
  }, [favicon]);

  return null;
};

export default FaviconInjector;
