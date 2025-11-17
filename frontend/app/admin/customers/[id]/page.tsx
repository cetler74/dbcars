'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getAdminCustomer,
  updateCustomer,
  updateCustomerBlacklist,
} from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Ban,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Car,
  Euro,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Navigation,
  CreditCard,
  Clock,
  User
} from 'lucide-react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';
import StatusBadge from '@/components/admin/StatusBadge';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    setLoading(true);
    try {
      const data = await getAdminCustomer(customerId);
      setCustomer(data);
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Error loading customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      date_of_birth: customer.date_of_birth ? new Date(customer.date_of_birth).toISOString().split('T')[0] : '',
      license_number: customer.license_number || '',
      license_country: customer.license_country || '',
      license_expiry: customer.license_expiry ? new Date(customer.license_expiry).toISOString().split('T')[0] : '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!customer) return;
    
    try {
      const dataToUpdate = { ...editForm };
      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === '') {
          dataToUpdate[key] = null;
        }
      });

      await updateCustomer(customer.id, dataToUpdate);
      await loadCustomer();
      setIsEditing(false);
      setEditForm({});
      toast.success('Customer information updated successfully!');
    } catch (error) {
      toast.error('Error updating customer information');
      console.error('Error:', error);
    }
  };

  const handleBlacklistToggle = async () => {
    if (customer.is_blacklisted) {
      if (confirm('Remove this customer from blacklist?')) {
        try {
          await updateCustomerBlacklist(customer.id, false);
          await loadCustomer();
          toast.success('Customer removed from blacklist');
        } catch (error) {
          toast.error('Error updating blacklist status');
        }
      }
    } else {
      setShowBlacklistModal(true);
    }
  };

  const handleBlacklistSubmit = async () => {
    if (!customer) return;
    try {
      await updateCustomerBlacklist(customer.id, true, blacklistReason);
      setShowBlacklistModal(false);
      setBlacklistReason('');
      await loadCustomer();
      toast.success('Customer added to blacklist');
    } catch (error) {
      toast.error('Error updating blacklist status');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <LoadingSpinner size="md" text="Loading customer details..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <EmptyState
          icon={User}
          title="Customer not found"
          description="The customer you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/customers')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-gray-600 text-lg">
              Member since {formatDate(customer.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {!isEditing && (
            <>
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Customer
              </button>
              <button
                onClick={handleBlacklistToggle}
                className={`px-4 py-2 rounded-xl transition-all text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 ${
                  customer.is_blacklisted
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700'
                }`}
              >
                {customer.is_blacklisted ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Remove from Blacklist
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Add to Blacklist
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Customer Information Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
        </div>

        <div className="p-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.license_number}
                      onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">License Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.license_country}
                      onChange={(e) => setEditForm({ ...editForm, license_country: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">License Expiry</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={editForm.license_expiry}
                      onChange={(e) => setEditForm({ ...editForm, license_expiry: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="font-medium text-gray-900 mt-1">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Phone</label>
                  <p className="font-medium text-gray-900 mt-1">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Date of Birth</label>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(customer.date_of_birth)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">License Number</label>
                  <p className="font-medium text-gray-900 mt-1">{customer.license_number || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">License Country</label>
                  <p className="font-medium text-gray-900 mt-1">{customer.license_country || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">License Expiry</label>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(customer.license_expiry)}</p>
                </div>
              </div>
              <div className="col-span-2 flex items-start gap-3">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold text-gray-600">Address</label>
                  <p className="font-medium text-gray-900 mt-1">
                    {customer.address || 'N/A'}
                    {customer.city && `, ${customer.city}`}
                    {customer.country && `, ${customer.country}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <div className="mt-1">
                    {customer.is_blacklisted ? (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 text-red-700 shadow-sm shadow-red-200/50 inline-flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5" />
                        Blacklisted
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 shadow-sm shadow-emerald-200/50 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {customer.is_blacklisted && customer.blacklist_reason && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Blacklist Reason</label>
                    <p className="font-medium text-red-600 mt-1">{customer.blacklist_reason}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reservation History Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">Reservation History</h2>
        </div>

        <div className="p-6">
          {customer.bookings && customer.bookings.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Booking #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Pick-up
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Drop-off
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Total Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {customer.bookings.map((booking: any) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/bookings?booking=${booking.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                          #{booking.booking_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {booking.make} {booking.model} ({booking.year})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(booking.pickup_date)}
                            </p>
                            <p className="text-xs text-gray-500">{booking.pickup_location_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(booking.dropoff_date)}
                            </p>
                            <p className="text-xs text-gray-500">{booking.dropoff_location_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(parseFloat(booking.total_price))}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={booking.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(booking.created_at)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="No reservations found"
              description="This customer hasn't made any reservations yet."
            />
          )}
        </div>
      </div>

      {/* Blacklist Modal */}
      {showBlacklistModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowBlacklistModal(false);
              setBlacklistReason('');
            }}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600">
                <h2 className="text-xl font-bold text-white">Add to Blacklist</h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-600 mb-2">
                    Customer: <span className="font-semibold text-gray-900">{customer.first_name} {customer.last_name}</span>
                  </p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason (optional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                      rows={4}
                      placeholder="Enter reason for blacklisting..."
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleBlacklistSubmit}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Add to Blacklist
                  </button>
                  <button
                    onClick={() => {
                      setShowBlacklistModal(false);
                      setBlacklistReason('');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
