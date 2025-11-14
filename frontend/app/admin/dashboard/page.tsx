'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAdminStatistics } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await getAdminStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p>Loading dashboard...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Today&apos;s Pickups</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.today_pickups || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Today&apos;s Returns</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.today_returns || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Monthly Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">
            €{stats?.monthly_revenue?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Monthly Bookings</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.monthly_bookings || 0}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Upcoming Reservations</h2>
        <p className="text-gray-600">
          {stats?.upcoming_reservations || 0} reservations in the next 7 days
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/bookings"
          className="bg-gray-900 text-white p-6 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2">Manage Bookings</h3>
          <p className="text-gray-300">View and manage all rental bookings</p>
        </Link>

        <Link
          href="/admin/vehicles"
          className="bg-gray-900 text-white p-6 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2">Manage Vehicles</h3>
          <p className="text-gray-300">Add, edit, or remove vehicles from fleet</p>
        </Link>

        <Link
          href="/admin/availability"
          className="bg-gray-900 text-white p-6 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2">View Availability</h3>
          <p className="text-gray-300">Check vehicle availability calendar</p>
        </Link>
      </div>
    </AdminLayout>
  );
}

