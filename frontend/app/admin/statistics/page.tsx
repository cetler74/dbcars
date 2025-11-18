'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAdminStatistics, getAdminBookings } from '@/lib/api';

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, bookingsData] = await Promise.all([
        getAdminStatistics(),
        getAdminBookings(),
      ]);
      setStats(statsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p>Loading statistics...</p>
      </AdminLayout>
    );
  }

  // Calculate additional statistics
  const totalRevenue = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const activeBookings = bookings.filter((b) => b.status === 'active').length;

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Statistics & Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">€{totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Completed</h3>
          <p className="text-3xl font-bold text-gray-900">{completedBookings}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Active</h3>
          <p className="text-3xl font-bold text-gray-900">{activeBookings}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Monthly Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Monthly Revenue</h3>
            <p className="text-2xl font-bold">
              €{stats?.monthly_revenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Monthly Bookings</h3>
            <p className="text-2xl font-bold">{stats?.monthly_bookings || 0}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

