'use client';

import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't wrap login page with AdminLayout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  return <AdminLayout>{children}</AdminLayout>;
}

