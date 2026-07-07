'use client';

import dynamic from 'next/dynamic';

const SellerLayout = dynamic(() => import('./SellerLayout'), { ssr: false });

export default SellerLayout;
