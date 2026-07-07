'use client';

import dynamic from 'next/dynamic';

const CheckoutPage = dynamic(() => import('./CheckoutForm'), { ssr: false });

export default CheckoutPage;
