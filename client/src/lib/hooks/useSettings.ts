'use client';

import { useQuery } from '@tanstack/react-query';
import { getSettings } from '@/services/productService';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 5 * 60 * 1000,
  });
};

export const useHidePrices = () => {
  const { data } = useSettings();
  return data?.settings?.hidePrices === true;
};
