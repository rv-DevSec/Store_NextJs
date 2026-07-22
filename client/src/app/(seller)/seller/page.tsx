'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SellerRedirect = () => {
  const router = useRouter();
  useEffect(() => { router.replace('/seller/orders'); }, [router]);
  return null;
};

export default SellerRedirect;
