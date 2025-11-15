'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  getAdminCustomers,
  getAdminCustomer,
  updateCustomerBlacklist,
  updateCustomer,
} from '@/lib/api';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlacklisted, setFilterBlacklisted] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [searchTerm, filterBlacklisted]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterBlacklisted !== 'all') {
        filters.blacklisted = filterBlacklisted === 'true';
      }
      const data = await getAdminCustomers(filters);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (customerId: string) => {
    try {
      const data = await getAdminCustomer(customerId);
      setSelectedCustomer(data);
      setShowDetails(true);
    } catch (error) {
      alert('Error loading customer details');
    }
  };

  const handleBlacklistToggle = async (customer: any) => {
    if (customer.is_blacklisted) {
      // Remove from blacklist
      if (confirm('Remove this customer from blacklist?')) {
        try {
          await updateCustomerBlacklist(customer.id, false);
          loadCustomers();
          if (selectedCustomer?.id === customer.id) {
            setSelectedCustomer({ ...selectedCustomer, is_blacklisted: false, blacklist_reason: null });
          }
        } catch (error) {
          alert('Error updating blacklist status');
        }
      }
    } else {
      // Add to blacklist
      setSelectedCustomer(customer);
      setShowBlacklistModal(true);
    }
  };

  const handleBlacklistSubmit = async () => {
    if (!selectedCustomer) return;
    try {
      await updateCustomerBlacklist(selectedCustomer.id, true, blacklistReason);
      setShowBlacklistModal(false);
      setBlacklistReason('');
      loadCustomers();
      if (showDetails) {
        const updated = await getAdminCustomer(selectedCustomer.id);
        setSelectedCustomer(updated);
      }
    } catch (error) {
      alert('Error updating blacklist status');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `€${Number(amount || 0).toFixed(2)}`;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customer Management</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <select
              value={filterBlacklisted}
              onChange={(e) => setFilterBlacklisted(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Customers</option>
              <option value="false">Active Customers</option>
              <option value="true">Blacklisted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <p>Loading customers...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Spent
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
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr 
                    key={customer.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleViewDetails(customer.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Member since {formatDate(customer.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {customer.total_bookings || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.is_blacklisted ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Blacklisted
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleViewDetails(customer.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleBlacklistToggle(customer)}
                        className={`${
                          customer.is_blacklisted
                            ? 'text-green-600 hover:text-green-900'
                            : 'text-red-600 hover:text-red-900'
                        }`}
                      >
                        {customer.is_blacklisted ? 'Remove from Blacklist' : 'Add to Blacklist'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowDetails(false)}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
                {/* Customer Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Phone</label>
                      <p className="font-medium">{selectedCustomer.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Date of Birth</label>
                      <p className="font-medium">{formatDate(selectedCustomer.date_of_birth)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">License Number</label>
                      <p className="font-medium">{selectedCustomer.license_number || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">License Country</label>
                      <p className="font-medium">{selectedCustomer.license_country || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">License Expiry</label>
                      <p className="font-medium">{formatDate(selectedCustomer.license_expiry)}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Address</label>
                      <p className="font-medium">
                        {selectedCustomer.address || 'N/A'}
                        {selectedCustomer.city && `, ${selectedCustomer.city}`}
                        {selectedCustomer.country && `, ${selectedCustomer.country}`}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Status</label>
                      <p>
                        {selectedCustomer.is_blacklisted ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Blacklisted
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </p>
                    </div>
                    {selectedCustomer.is_blacklisted && selectedCustomer.blacklist_reason && (
                      <div>
                        <label className="text-sm text-gray-600">Blacklist Reason</label>
                        <p className="font-medium text-red-600">{selectedCustomer.blacklist_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reservation History */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Reservation History</h3>
                  {selectedCustomer.bookings && selectedCustomer.bookings.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCustomer.bookings.map((booking: any) => (
                        <div
                          key={booking.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">
                                {booking.make} {booking.model} ({booking.year})
                              </p>
                              <p className="text-sm text-gray-600">
                                Booking #{booking.booking_number}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                booking.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'active'
                                    ? 'bg-blue-100 text-blue-800'
                                    : booking.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Pickup:</span>{' '}
                              {formatDate(booking.pickup_date)} - {booking.pickup_location_name}
                            </div>
                            <div>
                              <span className="text-gray-600">Dropoff:</span>{' '}
                              {formatDate(booking.dropoff_date)} - {booking.dropoff_location_name}
                            </div>
                            <div>
                              <span className="text-gray-600">Total Price:</span>{' '}
                              <span className="font-semibold">{formatCurrency(booking.total_price)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Created:</span>{' '}
                              {formatDate(booking.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No reservations found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Modal */}
      {showBlacklistModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => {
              setShowBlacklistModal(false);
              setBlacklistReason('');
            }}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">Add to Blacklist</h2>
              <p className="text-gray-600 mb-4">
                Customer: {selectedCustomer.first_name} {selectedCustomer.last_name}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Enter reason for blacklisting..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleBlacklistSubmit}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Add to Blacklist
                </button>
                <button
                  onClick={() => {
                    setShowBlacklistModal(false);
                    setBlacklistReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

