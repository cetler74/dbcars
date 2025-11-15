'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAdminBookings, updateBookingStatus, getBooking } from '@/lib/api';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    vehicle_id: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    loadBookings();
  }, [filters]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getAdminBookings(filters);
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      loadBookings();
      if (selectedBooking?.id === bookingId) {
        // Reload details if viewing this booking
        handleViewBooking(selectedBooking);
      }
    } catch (error) {
      alert('Error updating booking status');
    }
  };

  const handleViewBooking = async (booking: any) => {
    setSelectedBooking(booking);
    setLoadingDetails(true);
    try {
      const details = await getBooking(booking.booking_number);
      setBookingDetails(details);
    } catch (error) {
      console.error('Error loading booking details:', error);
      alert('Error loading booking details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setBookingDetails(null);
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Bookings Management</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', vehicle_id: '', date_from: '', date_to: '' })}
              className="w-full bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-600">No bookings found</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Booking #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pick-up Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr 
                  key={booking.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewBooking(booking)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
                    {booking.booking_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {booking.first_name} {booking.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {booking.make} {booking.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(booking.pickup_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    €{parseFloat(booking.total_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={booking.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(booking.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Details Modal - Full Page */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen">
            {/* Header - Sticky */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
              <h2 className="text-3xl font-bold">Booking Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-8 max-w-6xl">
              {loadingDetails ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  <p className="mt-4 text-gray-600 text-lg">Loading booking details...</p>
                </div>
              ) : bookingDetails ? (
                <div className="space-y-8">
                  {/* Booking Information */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Booking Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <span className="text-gray-600">Booking Number:</span>
                        <p className="font-medium">{bookingDetails.booking_number}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <p>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              bookingDetails.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : bookingDetails.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : bookingDetails.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {bookingDetails.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <p className="font-medium">
                          {new Date(bookingDetails.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium">
                          {bookingDetails.first_name} {bookingDetails.last_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{bookingDetails.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium">{bookingDetails.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-gray-600">Vehicle:</span>
                        <p className="font-medium">
                          {bookingDetails.make} {bookingDetails.model} ({bookingDetails.year})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rental Details */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Rental Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-gray-600">Pick-up Location:</span>
                        <p className="font-medium">{bookingDetails.pickup_location_name}</p>
                        {bookingDetails.pickup_location_address && (
                          <p className="text-sm text-gray-500">{bookingDetails.pickup_location_address}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Drop-off Location:</span>
                        <p className="font-medium">{bookingDetails.dropoff_location_name}</p>
                        {bookingDetails.dropoff_location_address && (
                          <p className="text-sm text-gray-500">{bookingDetails.dropoff_location_address}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Pick-up Date:</span>
                        <p className="font-medium">
                          {new Date(bookingDetails.pickup_date).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Drop-off Date:</span>
                        <p className="font-medium">
                          {new Date(bookingDetails.dropoff_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Pricing</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-medium">€{parseFloat(bookingDetails.base_price || 0).toFixed(2)}</span>
                      </div>
                      {bookingDetails.extras_price > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Extras:</span>
                          <span className="font-medium">€{parseFloat(bookingDetails.extras_price || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {bookingDetails.discount_amount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span>-€{parseFloat(bookingDetails.discount_amount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-lg">
                        <span>Total:</span>
                        <span>€{parseFloat(bookingDetails.total_price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Extras */}
                  {bookingDetails.booking_extras && Array.isArray(bookingDetails.booking_extras) && bookingDetails.booking_extras.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold mb-4 text-gray-900">Selected Extras</h3>
                      <div className="space-y-2">
                        {bookingDetails.booking_extras.map((extra: any, index: number) => (
                          <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>{extra.name} {extra.quantity > 1 && `(x${extra.quantity})`}</span>
                            <span className="font-medium">€{parseFloat(extra.price || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {bookingDetails.notes && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold mb-4 text-gray-900">Notes</h3>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">{bookingDetails.notes}</p>
                    </div>
                  )}

                  {/* Update Status */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Update Status</h3>
                    <select
                      value={bookingDetails.status}
                      onChange={(e) => handleStatusUpdate(bookingDetails.id, e.target.value)}
                      className="px-6 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-600 text-lg">Failed to load booking details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

