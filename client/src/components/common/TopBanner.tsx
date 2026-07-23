'use client';

import { useQuery } from '@tanstack/react-query';
import { getSettings } from '@/services/productService';

const TopBanner = () => {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const festival = data?.settings?.festival;
  if (!festival?.topBanner || !festival?.topBannerText) return null;

  return (
    <div className="bg-gradient-to-l from-primary to-primary-dark text-white text-center text-sm font-bold py-2 px-4">
      {festival.topBannerText}
    </div>
  );
};

export default TopBanner;
