'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminCustomers,
  updateCustomerBlacklist,
} from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  MoreVertical,
  Eye, 
  Ban, 
  UserCheck,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Euro,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlacklisted, setFilterBlacklisted] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [searchTerm, filterBlacklisted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

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
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (customerId: string) => {
    router.push(`/admin/customers/${customerId}`);
  };

  const handleBlacklistToggle = async (customer: any) => {
    if (customer.is_blacklisted) {
      // Remove from blacklist
      if (confirm('Remove this customer from blacklist?')) {
        try {
          await updateCustomerBlacklist(customer.id, false);
          toast.success('Customer removed from blacklist');
          loadCustomers();
        } catch (error) {
          toast.error('Error updating blacklist status');
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
      toast.success('Customer added to blacklist');
      setShowBlacklistModal(false);
      setBlacklistReason('');
      loadCustomers();
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

  const hasActiveFilters = searchTerm || filterBlacklisted !== 'all';

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600 text-lg">View and manage customer accounts and bookings</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div 
          className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">Search & Filters</h2>
              {hasActiveFilters && (
                <span className="px-2.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                  Active
                </span>
              )}
            </div>
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              {showFilters ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Customer</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    value={filterBlacklisted}
                    onChange={(e) => setFilterBlacklisted(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white appearance-none"
                  >
                    <option value="all">All Customers</option>
                    <option value="false">Active Customers</option>
                    <option value="true">Blacklisted</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBlacklisted('all');
                  }}
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading customers..." />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={Users}
            title="No customers found"
            description={hasActiveFilters ? "Try adjusting your filters to see more results." : "No customers have registered yet."}
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total Bookings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr 
                    key={customer.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleViewDetails(customer.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {customer.first_name} {customer.last_name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Member since {formatDate(customer.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900">{customer.total_bookings || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(customer.total_spent)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.is_blacklisted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Blacklisted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="relative" ref={(el) => (menuRefs.current[customer.id] = el)}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === customer.id && (
                          <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                            <button
                              onClick={() => {
                                handleViewDetails(customer.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                handleBlacklistToggle(customer);
                                setOpenMenuId(null);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                customer.is_blacklisted
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-red-600 hover:bg-red-50'
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
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {customers.map((customer) => (
              <div 
                key={customer.id}
                className="p-4 cursor-pointer"
                onClick={() => handleViewDetails(customer.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {customer.first_name} {customer.last_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Member since {formatDate(customer.created_at)}
                      </p>
                    </div>
                  </div>
                  {customer.is_blacklisted ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                      <XCircle className="w-3 h-3" />
                      Blacklisted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-600">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600">{customer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600">
                        <span className="font-bold text-gray-900">{customer.total_bookings || 0}</span> bookings
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-gray-900">{formatCurrency(customer.total_spent)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-3" onClick={(e) => e.stopPropagation()}>
                  <div className="relative" ref={(el) => (menuRefs.current[`mobile-${customer.id}`] = el)}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === `mobile-${customer.id}` ? null : `mobile-${customer.id}`)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuId === `mobile-${customer.id}` && (
                      <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                        <button
                          onClick={() => {
                            handleViewDetails(customer.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            handleBlacklistToggle(customer);
                            setOpenMenuId(null);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                            customer.is_blacklisted
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-red-600 hover:bg-red-50'
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blacklist Modal */}
      {showBlacklistModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowBlacklistModal(false);
              setBlacklistReason('');
            }}
          ></div>
          <div className="flex min-h-full items-center justify-center">
            <div
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Add to Blacklist</h2>
                </div>
                <button 
                  onClick={() => {
                    setShowBlacklistModal(false);
                    setBlacklistReason('');
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">Customer:</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{selectedCustomer.email}</p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason <span className="text-xs text-gray-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={blacklistReason}
                    onChange={(e) => setBlacklistReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                    rows={3}
                    placeholder="Enter reason for blacklisting..."
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={handleBlacklistSubmit}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Ban className="w-5 h-5" />
                    Add to Blacklist
                  </button>
                  <button
                    onClick={() => {
                      setShowBlacklistModal(false);
                      setBlacklistReason('');
                    }}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <X className="w-5 h-5" />
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
