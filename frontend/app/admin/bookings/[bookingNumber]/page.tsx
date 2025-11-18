'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBooking, updateBookingStatus } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Calendar,
  Car,
  Users,
  MapPin,
  Euro,
  FileText,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  ExternalLink
} from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import LoadingSpinner from '@/components/admin/LoadingSpinner';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingNumber = params?.bookingNumber as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');

  const getImageUrl = useMemo(
    () => (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const baseUrl = apiUrl.replace('/api', '');
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    },
    []
  );

  useEffect(() => {
    if (bookingNumber) {
      loadBooking();
    }
  }, [bookingNumber]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const data = await getBooking(bookingNumber);
      setBooking(data);
    } catch (error: any) {
      console.error('Error loading booking:', error);
      // If booking not found, it might be mock data - show helpful message
      if (error.response?.status === 404) {
        toast.error('Booking not found. This may be mock data that doesn\'t exist in the database.');
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to load booking details';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, paymentLinkValue?: string) => {
    if (!booking) return;
    
    try {
      setUpdating(true);
      await updateBookingStatus(booking.id, newStatus, undefined, paymentLinkValue);
      toast.success('Booking status updated successfully');
      await loadBooking();
      if (paymentLinkValue) {
        toast.success('Payment link sent to customer via email');
      }
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast.error(error.response?.data?.error || 'Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmBooking = () => {
    setPaymentLink('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = () => {
    if (!paymentLink.trim()) {
      toast.error('Please enter a payment link');
      return;
    }
    // Set status to 'waiting_payment' when payment link is provided
    // This indicates the booking is approved but payment is pending
    handleStatusUpdate('waiting_payment', paymentLink);
    setShowPaymentModal(false);
    setPaymentLink('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading booking details..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find a booking with that reference.
          </p>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const images = Array.isArray(booking.images)
    ? booking.images
    : booking.images
    ? [booking.images]
    : [];
  const mainImage = images.length > 0 ? images[0] : null;
  const bookingExtras = booking.booking_extras || [];

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Bookings</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Booking Details
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-gray-700">
                  {booking.booking_number}
                </span>
                <StatusBadge status={booking.status} size="md" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {booking.status === 'pending' && (
                <button
                  onClick={handleConfirmBooking}
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Booking
                </button>
              )}
              {booking.status === 'waiting_payment' && (
                <button
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Confirmed
                </button>
              )}
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusUpdate('active')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Active
                </button>
              )}
              {booking.status === 'active' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Completed
                </button>
              )}
              {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'active') && (
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Information Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Car className="w-5 h-5 text-orange-600" />
                  Vehicle Information
                </h2>
              </div>
              <div className="p-6">
                {mainImage && (
                  <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden">
                    <Image
                      src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                      alt={`${booking.make} ${booking.model}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 font-medium">Vehicle</span>
                    <span className="text-gray-900 font-semibold text-right">
                      {booking.make} {booking.model} {booking.year && `(${booking.year})`}
                    </span>
                  </div>
                  {booking.vehicle_subunit_id && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 font-medium">Subunit ID</span>
                      <span className="text-gray-900 font-semibold text-right">
                        {booking.vehicle_subunit_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rental Details Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  Rental Details
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Pickup Location
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {booking.pickup_location_name}
                    </p>
                    {booking.pickup_location_address && (
                      <p className="text-sm text-gray-600">
                        {booking.pickup_location_address}
                      </p>
                    )}
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-1">Pickup Date & Time</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formatDate(booking.pickup_date)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Dropoff Location
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {booking.dropoff_location_name}
                    </p>
                    {booking.dropoff_location_address && (
                      <p className="text-sm text-gray-600">
                        {booking.dropoff_location_address}
                      </p>
                    )}
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-1">Dropoff Date & Time</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formatDate(booking.dropoff_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Extras Card */}
            {bookingExtras.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Selected Extras
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {bookingExtras.map((extra: any, index: number) => (
                      <div
                        key={extra.id || index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{extra.name}</p>
                          {extra.quantity > 1 && (
                            <p className="text-sm text-gray-600">Quantity: {extra.quantity}</p>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(extra.price || 0) * (extra.quantity || 1))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes Card */}
            {booking.notes && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Notes
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Euro className="w-5 h-5 text-orange-600" />
                  Pricing Summary
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(parseFloat(booking.base_price || 0))}
                    </span>
                  </div>
                  {parseFloat(booking.extras_price || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Extras</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(parseFloat(booking.extras_price || 0))}
                      </span>
                    </div>
                  )}
                  {parseFloat(booking.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span className="font-semibold">
                        -{formatCurrency(parseFloat(booking.discount_amount || 0))}
                      </span>
                    </div>
                  )}
                  {booking.coupon_code && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coupon Code</span>
                      <span className="font-medium text-gray-700">{booking.coupon_code}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(parseFloat(booking.total_price || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Customer Information
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Full Name</p>
                    <p className="font-semibold text-gray-900">
                      {booking.first_name} {booking.last_name}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">Email</p>
                    </div>
                    <a
                      href={`mailto:${booking.email}`}
                      className="font-semibold text-blue-600 hover:text-blue-800 break-all"
                    >
                      {booking.email}
                    </a>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">Phone</p>
                    </div>
                    <a
                      href={`tel:${booking.phone}`}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {booking.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Metadata Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Booking Information
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Booking Number</p>
                    <p className="font-semibold text-gray-900">{booking.booking_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Status</p>
                    <StatusBadge status={booking.status} size="md" />
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Created At</p>
                    <p className="font-semibold text-gray-900">
                      {booking.created_at ? formatDate(booking.created_at) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Last Updated</p>
                    <p className="font-semibold text-gray-900">
                      {booking.updated_at ? formatDate(booking.updated_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Link Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Approve Booking & Send Payment Link</h3>
            <p className="text-gray-600 mb-6">
              Please enter the payment link to send to the customer. The booking will be set to "Waiting Payment" status and an email will be automatically sent with the payment link.
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
                disabled={!paymentLink.trim() || updating}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {updating ? 'Processing...' : 'Send Payment Link'}
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentLink('');
                }}
                disabled={updating}
                className="flex-1 bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

