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
    // Refresh every 60 seconds
    const interval = setInterval(loadStatistics, 60000);
    return () => clearInterval(interval);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const revenueChange = parseFloat(stats?.revenue_change || '0');
  const isRevenueUp = revenueChange > 0;

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pending Bookings */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <Link href="/admin/bookings?status=pending" className="text-yellow-700 hover:text-yellow-900 text-sm font-medium">
              View all →
            </Link>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Pending Bookings</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.pending_bookings || 0}</p>
          <p className="text-xs text-gray-600 mt-2">Requires attention</p>
        </div>

        {/* Today's Pickups */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <Link href="/admin/bookings" className="text-blue-700 hover:text-blue-900 text-sm font-medium">
              View all →
            </Link>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Today&apos;s Pickups</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.today_pickups || 0}</p>
          <p className="text-xs text-gray-600 mt-2">Scheduled for today</p>
        </div>

        {/* Today's Returns */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <Link href="/admin/bookings" className="text-green-700 hover:text-green-900 text-sm font-medium">
              View all →
            </Link>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Today&apos;s Returns</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.today_returns || 0}</p>
          <p className="text-xs text-gray-600 mt-2">Expected today</p>
        </div>

        {/* Active Rentals */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <Link href="/admin/bookings?status=active" className="text-purple-700 hover:text-purple-900 text-sm font-medium">
              View all →
            </Link>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Active Rentals</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.active_rentals || 0}</p>
          <p className="text-xs text-gray-600 mt-2">Currently rented</p>
        </div>
      </div>

      {/* Revenue & Bookings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Monthly Revenue */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Monthly Revenue</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            €{stats?.monthly_revenue?.toFixed(2) || '0.00'}
          </p>
          <div className="flex items-center gap-2">
            {revenueChange !== 0 && (
              <>
                <span className={`text-sm font-medium ${isRevenueUp ? 'text-green-600' : 'text-red-600'}`}>
                  {isRevenueUp ? '↑' : '↓'} {Math.abs(revenueChange)}%
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </>
            )}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Total Revenue</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            €{stats?.total_revenue?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-gray-500">All time completed bookings</p>
        </div>

        {/* Monthly Bookings */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Monthly Bookings</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.monthly_bookings || 0}
          </p>
          <p className="text-xs text-gray-500">This month</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Bookings */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            {stats?.recent_bookings && stats.recent_bookings.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recent_bookings.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/admin/bookings`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {booking.booking_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {booking.first_name} {booking.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {booking.make} {booking.model}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No recent bookings</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Booking Status Overview</h2>
          </div>
          <div className="p-6">
            {stats?.status_breakdown ? (
              <div className="space-y-4">
                {Object.entries(stats.status_breakdown).map(([status, count]: [string, any]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(status)}`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            status === 'completed' || status === 'confirmed' ? 'bg-green-500' :
                            status === 'active' ? 'bg-blue-500' :
                            status === 'pending' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{
                            width: `${(count / (stats.monthly_bookings || 1)) * 100}%`,
                            maxWidth: '100%'
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No status data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Pickups */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Pickups</h2>
            <span className="text-sm text-gray-600">Next 7 days</span>
          </div>
          <div className="p-6">
            {stats?.upcoming_pickups && stats.upcoming_pickups.length > 0 ? (
              <div className="space-y-4">
                {stats.upcoming_pickups.map((booking: any) => (
                  <div key={booking.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {booking.make} {booking.model}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {booking.first_name} {booking.last_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {booking.pickup_location_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(booking.pickup_date)}
                        </p>
                        <span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No upcoming pickups</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Returns */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Returns</h2>
            <span className="text-sm text-gray-600">Next 7 days</span>
          </div>
          <div className="p-6">
            {stats?.upcoming_returns && stats.upcoming_returns.length > 0 ? (
              <div className="space-y-4">
                {stats.upcoming_returns.map((booking: any) => (
                  <div key={booking.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {booking.make} {booking.model}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {booking.first_name} {booking.last_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {booking.dropoff_location_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(booking.dropoff_date)}
                        </p>
                        <span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No upcoming returns</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </AdminLayout>
  );
}
