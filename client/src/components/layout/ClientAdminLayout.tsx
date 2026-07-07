'use client';

import dynamic from 'next/dynamic';

const AdminLayout = dynamic(() => import('./AdminLayout'), { ssr: false });

export default AdminLayout;
