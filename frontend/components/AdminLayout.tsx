'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('auth_token');
      
      if (!token || !userStr) {
        router.push('/admin/login');
        return;
      }

      setUser(JSON.parse(userStr));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/bookings', label: 'Bookings' },
    { href: '/admin/vehicles', label: 'Vehicles' },
    { href: '/admin/extras', label: 'Extras' },
    { href: '/admin/customers', label: 'Customers' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/availability', label: 'Availability' },
    { href: '/admin/statistics', label: 'Statistics' },
    { href: '/admin/blog', label: 'Blog Posts' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed top-0 left-0 h-screen z-40 flex flex-col overflow-hidden">
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-center mb-3">
            <Link href="/admin/dashboard" className="text-lg font-bold text-gray-900">
              Admin Panel
            </Link>
          </div>
          <Link
            href="/"
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Homepage
          </Link>
        </div>

        {/* Navigation - Scrollable area between header and user section */}
        <nav className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-2.5 rounded-lg transition-colors text-sm ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* User Info & Logout - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-1">Logged in as</p>
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </div>
    </div>
  );
}

