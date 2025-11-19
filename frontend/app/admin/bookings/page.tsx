'use client';

import { useEffect, useState } from 'react';
import { getAdminBookings, updateBookingStatus, getBooking, getInvoice, downloadInvoice, generateInvoice } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Plus, 
  Download, 
  Search, 
  X, 
  Calendar,
  Car,
  Users,
  Euro,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [bookingToConfirm, setBookingToConfirm] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelNotes, setCancelNotes] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [invoice, setInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    vehicle_id: '',
    date_from: '',
    date_to: '',
    booking_number: '',
    customer_name: '',
    vehicle_search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [filters, pagination.page]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getAdminBookings({
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page
      });
      setBookings(data.bookings || data);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string, paymentLinkValue?: string) => {
    try {
      const notes = newStatus === 'cancelled' ? cancelNotes : undefined;
      await updateBookingStatus(bookingId, newStatus, notes, paymentLinkValue);
      toast.success('Booking status updated successfully');
      loadBookings();
      if (selectedBooking?.id === bookingId) {
        handleViewBooking(selectedBooking);
      }
      setShowPaymentModal(false);
      setPaymentLink('');
      setBookingToConfirm(null);
      if (newStatus === 'cancelled') {
        setShowCancelModal(false);
        setCancelNotes('');
        setBookingToCancel(null);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error updating booking status';
      toast.error(errorMessage);
    }
  };

  const handleConfirmClick = (bookingId: string) => {
    setBookingToConfirm(bookingId);
    setPaymentLink('');
    setShowPaymentModal(true);
  };

  const handleCancelClick = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelNotes('');
    setShowCancelModal(true);
  };

  const handlePaymentSubmit = () => {
    if (!paymentLink.trim()) {
      toast.error('Please enter a payment link');
      return;
    }
    if (bookingToConfirm) {
      handleStatusUpdate(bookingToConfirm, 'waiting_payment', paymentLink);
    }
  };

  const handleViewBooking = async (booking: any) => {
    setSelectedBooking(booking);
    setLoadingDetails(true);
    setLoadingInvoice(true);
    try {
      const details = await getBooking(booking.booking_number);
      setBookingDetails(details);
      
      // Load invoice if exists
      try {
        const invoiceData = await getInvoice(booking.id);
        setInvoice(invoiceData);
      } catch (error: any) {
        // Invoice not found is expected, don't show error
        if (error.response?.status !== 404) {
          console.error('Error loading invoice:', error);
        }
        setInvoice(null);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      toast.error('Error loading booking details');
    } finally {
      setLoadingDetails(false);
      setLoadingInvoice(false);
    }
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setBookingDetails(null);
    setInvoice(null);
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handleGenerateInvoice = async (bookingId: string, regenerate: boolean = false) => {
    setGeneratingInvoice(true);
    try {
      const result = await generateInvoice(bookingId, regenerate);
      setInvoice(result.invoice);
      toast.success(regenerate ? 'Invoice regenerated successfully' : 'Invoice generated successfully');
      // Reload booking details to refresh data
      if (selectedBooking) {
        handleViewBooking(selectedBooking);
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      const errorMessage = error.response?.data?.error || 'Failed to generate invoice';
      toast.error(errorMessage);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const exportToCSV = (data: any[]) => {
    const headers = ['Booking Number', 'Customer Name', 'Email', 'Phone', 'Vehicle', 'Pick-up Date', 'Drop-off Date', 'Status', 'Total Price'];
    const csvRows = [headers.join(',')];
    
    data.forEach(booking => {
      const row = [
        booking.booking_number,
        `"${booking.first_name} ${booking.last_name}"`,
        booking.email,
        booking.phone,
        `"${booking.make} ${booking.model}"`,
        new Date(booking.pickup_date).toLocaleDateString(),
        new Date(booking.dropoff_date).toLocaleDateString(),
        booking.status,
        booking.total_price
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${data.length} booking(s) to CSV`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const clearFilters = () => {
    setFilters({ status: '', vehicle_id: '', date_from: '', date_to: '', booking_number: '', customer_name: '', vehicle_search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Bookings Management</h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Manage and track all customer bookings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => window.location.href = '/admin/bookings/drafts'}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-gray-700"
          >
            <FileText className="w-4 h-4" />
            View Drafts
          </button>
          <button
            onClick={() => window.location.href = '/admin/bookings/new'}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create New Booking
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div 
          className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Search & Filters</h2>
              {hasActiveFilters && (
                <span className="px-2.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                  Active
                </span>
              )}
            </div>
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              {showFilters ? <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Number</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.booking_number}
              onChange={(e) => setFilters({ ...filters, booking_number: e.target.value })}
              placeholder="Search by booking #..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.customer_name}
              onChange={(e) => setFilters({ ...filters, customer_name: e.target.value })}
              placeholder="Search by customer name..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.vehicle_search}
              onChange={(e) => setFilters({ ...filters, vehicle_search: e.target.value })}
              placeholder="Search by make/model..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="waiting_payment">Waiting Payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>

          <div className="flex items-end">
            <button
                  onClick={clearFilters}
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

      {/* Bookings Table */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading bookings..." />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={FileText}
            title="No bookings found"
            description="Try adjusting your filters to see more results"
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Export and Bulk Actions Bar */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              {selectedBookings.size > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">
                    {selectedBookings.size} selected
                  </span>
                  <button
                    onClick={() => setSelectedBookings(new Set())}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                const dataToExport = selectedBookings.size > 0 
                  ? bookings.filter(b => selectedBookings.has(b.id))
                  : bookings;
                exportToCSV(dataToExport);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export {selectedBookings.size > 0 ? 'Selected' : 'All'} to CSV
            </button>
          </div>

          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={bookings.length > 0 && selectedBookings.size === bookings.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBookings(new Set(bookings.map(b => b.id)));
                      } else {
                        setSelectedBookings(new Set());
                      }
                    }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                </th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Booking #
                </th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Vehicle
                </th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Pick-up Date
                </th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Total Price
                </th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-100">
              {bookings.map((booking) => {
                const pickupDate = new Date(booking.pickup_date);
                const isToday = pickupDate.toDateString() === new Date().toDateString();
                const isTomorrow = pickupDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                
                return (
                <tr 
                  key={booking.id}
                    className="hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent cursor-pointer transition-colors group"
                  onClick={() => handleViewBooking(booking)}
                >
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedBookings.has(booking.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedBookings);
                        if (e.target.checked) {
                          newSelected.add(booking.id);
                        } else {
                          newSelected.delete(booking.id);
                        }
                        setSelectedBookings(newSelected);
                      }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-600 hover:text-blue-800 group-hover:underline">
                        {booking.booking_number}
                      </span>
                      {(isToday || isTomorrow) && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm">
                          {isToday ? 'Today' : 'Tomorrow'}
                        </span>
                      )}
                    </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-full">
                          <Users className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                    {booking.first_name} {booking.last_name}
                        </span>
                      </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                    {booking.make} {booking.model}
                        </span>
                      </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                    {new Date(booking.pickup_date).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric'
                    })} {new Date(booking.pickup_date).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                        </span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                    {booking.status === 'pending' ? (
                        <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmClick(booking.id)}
                            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-1"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Accept
                        </button>
                        <button
                          onClick={() => handleCancelClick(booking.id)}
                            className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-1"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    ) : booking.status === 'waiting_payment' ? (
                        <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all text-xs font-semibold shadow-sm hover:shadow-md"
                        >
                            Confirm
                        </button>
                        <button
                          onClick={() => handleCancelClick(booking.id)}
                            className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all text-xs font-semibold shadow-sm hover:shadow-md"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                        <button
                          onClick={() => handleViewBooking(booking)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {bookings.map((booking) => {
              const pickupDate = new Date(booking.pickup_date);
              const isToday = pickupDate.toDateString() === new Date().toDateString();
              const isTomorrow = pickupDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              
              return (
                <div
                  key={booking.id}
                  className="p-4 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent cursor-pointer transition-colors"
                  onClick={() => handleViewBooking(booking)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedBookings.has(booking.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSelected = new Set(selectedBookings);
                          if (e.target.checked) {
                            newSelected.add(booking.id);
                          } else {
                            newSelected.delete(booking.id);
                          }
                          setSelectedBookings(newSelected);
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm font-semibold text-blue-600">
                        {booking.booking_number}
                      </span>
                      {(isToday || isTomorrow) && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                          {isToday ? 'Today' : 'Tomorrow'}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={booking.status} size="sm" />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Customer:
                      </span>
                      <span className="font-semibold text-gray-900">{booking.first_name} {booking.last_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" />
                        Vehicle:
                      </span>
                      <span className="text-gray-700">{booking.make} {booking.model}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Pick-up:
                      </span>
                      <span className="text-gray-700">
                        {new Date(booking.pickup_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Euro className="w-3.5 h-3.5" />
                        Total:
                      </span>
                      <span className="font-bold text-gray-900">{formatCurrency(parseFloat(booking.total_price))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700 font-medium">
                Showing <span className="font-bold">{((pagination.page - 1) * pagination.per_page) + 1}</span> to{' '}
                <span className="font-bold">{Math.min(pagination.page * pagination.per_page, pagination.total)}</span> of{' '}
                <span className="font-bold">{pagination.total}</span> bookings
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(pagination.total_pages, 7) }, (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 7) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 4) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.total_pages - 3) {
                      pageNum = pagination.total_pages - 6 + i;
                    } else {
                      pageNum = pagination.page - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
                          pagination.page === pageNum
                            ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Modal - Full Page */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen">
            {/* Header - Sticky */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-50">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-gray-900">
                  Booking Details - {selectedBooking.booking_number}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-8 max-w-6xl">
              {loadingDetails ? (
                <LoadingSpinner size="lg" text="Loading booking details..." />
              ) : bookingDetails ? (
                <div className="space-y-6">
                  {/* Booking Information */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Booking Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Booking Number:</span>
                        <p className="font-bold text-gray-900 mt-1">{bookingDetails.booking_number}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Status:</span>
                        <p className="mt-1">
                          <StatusBadge status={bookingDetails.status} size="md" />
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Created:</span>
                        <p className="font-semibold text-gray-900 mt-1">
                          {new Date(bookingDetails.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} {new Date(bookingDetails.created_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  {bookingDetails.status !== 'cancelled' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Booking Status Timeline
                      </h3>
                      <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-1.5 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-300"
                            style={{
                              width: bookingDetails.status === 'pending' ? '0%' :
                                     bookingDetails.status === 'waiting_payment' ? '33%' :
                                     bookingDetails.status === 'confirmed' ? '66%' :
                                     bookingDetails.status === 'completed' ? '100%' : '0%'
                            }}
                          ></div>
                        </div>
                        
                        {/* Steps */}
                        {['pending', 'waiting_payment', 'confirmed', 'completed'].map((step, index) => {
                          const stepLabels = {
                            pending: 'Pending',
                            waiting_payment: 'Awaiting Payment',
                            confirmed: 'Confirmed',
                            completed: 'Completed'
                          };
                          
                          const statusIndex = ['pending', 'waiting_payment', 'confirmed', 'completed'].indexOf(bookingDetails.status);
                          const isActive = bookingDetails.status === step;
                          // A step is past if the current status index is greater than this step's index
                          // A step is completed if it's the current step or past
                          const isPast = statusIndex > index;
                          const isCompleted = statusIndex >= index; // Include current step as completed
                          
                          return (
                            <div key={step} className="flex flex-col items-center relative z-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-md ${
                                isCompleted ? 'bg-gradient-to-r from-emerald-600 to-green-500 border-emerald-600' :
                                isActive ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-600' :
                                'bg-white border-gray-300'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                ) : (
                                  <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              <span className={`mt-2 text-xs font-semibold ${isCompleted ? 'text-emerald-600' : isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                {stepLabels[step as keyof typeof stepLabels]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Name:</span>
                        <p className="font-bold text-gray-900 mt-1">
                          {bookingDetails.first_name} {bookingDetails.last_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Email:</span>
                        <p className="font-semibold text-gray-900 mt-1">{bookingDetails.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Phone:</span>
                        <p className="font-semibold text-gray-900 mt-1">{bookingDetails.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Vehicle:</span>
                        <p className="font-bold text-gray-900 mt-1">
                          {bookingDetails.make} {bookingDetails.model} ({bookingDetails.year})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rental Details */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Rental Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Pick-up Location:</span>
                        <p className="font-semibold text-gray-900 mt-1">{bookingDetails.pickup_location_name}</p>
                        {bookingDetails.pickup_location_address && (
                          <p className="text-sm text-gray-500 mt-1">{bookingDetails.pickup_location_address}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Drop-off Location:</span>
                        <p className="font-semibold text-gray-900 mt-1">{bookingDetails.dropoff_location_name}</p>
                        {bookingDetails.dropoff_location_address && (
                          <p className="text-sm text-gray-500 mt-1">{bookingDetails.dropoff_location_address}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Pick-up Date:</span>
                        <p className="font-semibold text-gray-900 mt-1">
                          {new Date(bookingDetails.pickup_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} {new Date(bookingDetails.pickup_date).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Drop-off Date:</span>
                        <p className="font-semibold text-gray-900 mt-1">
                          {new Date(bookingDetails.dropoff_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} {new Date(bookingDetails.dropoff_date).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                      <Euro className="w-5 h-5" />
                      Pricing
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Base Price:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(parseFloat(bookingDetails.base_price || 0))}</span>
                      </div>
                      {bookingDetails.extras_price > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Extras:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(parseFloat(bookingDetails.extras_price || 0))}</span>
                        </div>
                      )}
                      {bookingDetails.discount_amount > 0 && (
                        <div className="flex justify-between items-center text-emerald-600">
                          <span className="font-medium">Discount:</span>
                          <span className="font-bold">-{formatCurrency(parseFloat(bookingDetails.discount_amount || 0))}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t-2 border-gray-300 pt-3 font-bold text-xl">
                        <span>Total:</span>
                        <span>{formatCurrency(parseFloat(bookingDetails.total_price || 0))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Section */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Invoice
                    </h3>
                    {loadingInvoice ? (
                      <div className="text-center py-4">
                        <p className="text-gray-600">Loading invoice information...</p>
                      </div>
                    ) : invoice ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 font-medium">Invoice Number:</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">{invoice.invoice_number}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Generated: {new Date(invoice.created_at).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {invoice.sent_at && (
                                <p className="text-xs text-emerald-600 mt-1">
                                  Sent: {new Date(invoice.sent_at).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download PDF
                              </button>
                              <button
                                onClick={() => handleGenerateInvoice(bookingDetails.id, true)}
                                disabled={generatingInvoice}
                                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-700 hover:to-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                                title="Regenerate invoice (useful if PDF is broken or empty)"
                              >
                                {generatingInvoice ? (
                                  <>
                                    <LoadingSpinner size="sm" />
                                    Regenerating...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="w-4 h-4" />
                                    Regenerate
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="text-gray-600 mb-4">No invoice has been generated for this booking yet.</p>
                        {bookingDetails.status === 'confirmed' || bookingDetails.status === 'completed' ? (
                          <button
                            onClick={() => handleGenerateInvoice(bookingDetails.id)}
                            disabled={generatingInvoice}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                          >
                            {generatingInvoice ? (
                              <>
                                <LoadingSpinner size="sm" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4" />
                                Generate Invoice
                              </>
                            )}
                          </button>
                        ) : (
                          <p className="text-sm text-gray-500">Invoice will be automatically generated when booking is confirmed.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Extras */}
                  {bookingDetails.booking_extras && Array.isArray(bookingDetails.booking_extras) && bookingDetails.booking_extras.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold mb-4 text-gray-900">Selected Extras</h3>
                      <div className="space-y-2">
                        {bookingDetails.booking_extras.map((extra: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="font-medium text-gray-900">{extra.name} {extra.quantity > 1 && `(x${extra.quantity})`}</span>
                            <span className="font-bold text-gray-900">{formatCurrency(parseFloat(extra.price || 0))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {bookingDetails.notes && bookingDetails.status !== 'cancelled' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Notes
                      </h3>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">{bookingDetails.notes}</p>
                    </div>
                  )}

                  {/* Cancellation Notes */}
                  {bookingDetails.status === 'cancelled' && bookingDetails.notes && (
                    <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-200">
                      <h3 className="text-xl font-bold mb-4 text-red-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Cancellation Reason
                      </h3>
                      <p className="text-red-800 bg-white p-4 rounded-xl border border-red-200">{bookingDetails.notes}</p>
                    </div>
                  )}

                  {/* Update Status */}
                  {(bookingDetails.status === 'pending' || bookingDetails.status === 'waiting_payment' || bookingDetails.status === 'confirmed') && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold mb-4 text-gray-900">Actions</h3>
                      <div className="flex flex-wrap gap-4">
                        {bookingDetails.status === 'pending' && (
                          <button
                            onClick={() => {
                              setBookingToConfirm(bookingDetails.id);
                              setPaymentLink('');
                              setShowPaymentModal(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all text-lg font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Accept & Send Payment Link
                          </button>
                        )}
                        {bookingDetails.status === 'waiting_payment' && (
                          <button
                            onClick={() => handleStatusUpdate(bookingDetails.id, 'confirmed')}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-lg font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Mark as Confirmed
                          </button>
                        )}
                        {bookingDetails.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(bookingDetails.id, 'completed')}
                            className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all text-lg font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Mark as Completed
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setBookingToCancel(bookingDetails.id);
                            setCancelNotes('');
                            setShowCancelModal(true);
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all text-lg font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  )}
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

      {/* Payment Link Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Accept Booking & Send Payment Link</h3>
            <p className="text-gray-600 mb-6">
              Please enter the payment link to send to the customer. An email will be automatically sent with the payment link.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Payment Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="https://payment.example.com/..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePaymentSubmit}
                disabled={!paymentLink.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                Send Payment Link
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentLink('');
                  setBookingToConfirm(null);
                }}
                className="flex-1 bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Notes Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Cancel Booking</h3>
            <p className="text-gray-600 mb-6">
              Please provide a reason or note for cancelling this booking. This note will be stored with the booking.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Cancellation Note <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                rows={4}
                placeholder="Explain why this booking is being cancelled..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!cancelNotes.trim() || !bookingToCancel) return;
                  handleStatusUpdate(bookingToCancel, 'cancelled');
                }}
                disabled={!cancelNotes.trim() || !bookingToCancel}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                Confirm Cancellation
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelNotes('');
                  setBookingToCancel(null);
                }}
                className="flex-1 bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
