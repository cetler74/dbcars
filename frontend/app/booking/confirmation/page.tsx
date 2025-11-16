'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBooking } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingNumber = searchParams.get('bookingNumber');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      const data = await getBooking(bookingNumber!);
      setBooking(data);
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500">Loading booking confirmation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Booking Not Found</h1>
            <p className="text-gray-600">
              We couldn&apos;t find a booking with that reference. Please check your link or contact our team.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
          {/* Top: status + vehicle snapshot (stacked to optimize space) */}
          <div className="space-y-8 mb-10">
            <div className="text-left">
          {booking.status === 'pending' ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold mb-4">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Pending Review
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">Booking Pending</h1>
              <p className="text-gray-600">
                Your request has been received and is currently being reviewed by our team.
              </p>
              <p className="text-gray-600">
                We&apos;ll confirm your booking shortly and send a detailed email with all the information you need.
              </p>
              <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-black text-white">
                <span className="text-sm uppercase tracking-wide text-gray-300">Booking Number</span>
                <span className="text-lg font-semibold">{booking.booking_number}</span>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Confirmed
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">Booking Confirmed</h1>
              <p className="text-gray-600">
                Thank you for choosing DB Luxury Cars. Your booking has been successfully confirmed.
              </p>
              <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-black text-white">
                <span className="text-sm uppercase tracking-wide text-gray-300">Booking Number</span>
                <span className="text-lg font-semibold">{booking.booking_number}</span>
              </div>
            </>
          )}
            </div>

            {/* Vehicle snapshot card */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg w-full">
              {(() => {
                const images = Array.isArray(booking.images)
                  ? booking.images
                  : booking.images
                  ? [booking.images]
                  : [];
                const mainImage = images.length > 0 ? images[0] : null;

                return (
                  <>
                    <div className="relative w-full h-48">
                      {mainImage ? (
                        <Image
                          src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                          alt={`${booking.make} ${booking.model}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <span className="text-gray-300 text-sm">DB Luxury Cars</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                    </div>
                    <div className="p-4 flex items-center justify-between bg-black/40 text-white">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-300">Vehicle</p>
                        <p className="font-semibold text-white text-sm">
                          {booking.make} {booking.model}
                        </p>
                        {booking.year && (
                          <p className="text-xs text-gray-400 mt-0.5">{booking.year}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wide text-gray-300">Total</p>
                        <p className="text-lg font-semibold text-white">
                          €{parseFloat(booking.total_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: vehicle & rental */}
          <div className="space-y-6">
            {/* Vehicle Information */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Vehicle Information</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle</span>
                  <span className="font-medium text-gray-900 text-right">
                    {booking.make} {booking.model} {booking.year && `(${booking.year})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Rental Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-gray-600">Pick-up Location</p>
                    <p className="font-medium text-gray-900">{booking.pickup_location_name}</p>
                    {booking.pickup_location_address && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {booking.pickup_location_address}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-gray-600">Drop-off Location</p>
                    <p className="font-medium text-gray-900">{booking.dropoff_location_name}</p>
                    {booking.dropoff_location_address && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {booking.dropoff_location_address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between gap-4 pt-3 border-t border-gray-200 mt-1">
                  <div className="flex-1">
                    <p className="text-gray-600">Pick-up Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(booking.pickup_date).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-gray-600">Drop-off Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(booking.dropoff_date).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: pricing, customer */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Pricing Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-medium text-gray-900">
                    €{parseFloat(booking.base_price).toFixed(2)}
                  </span>
                </div>
                {booking.extras_price > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extras</span>
                    <span className="font-medium text-gray-900">
                      €{parseFloat(booking.extras_price).toFixed(2)}
                    </span>
                  </div>
                )}
                {booking.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-medium">
                      -€{parseFloat(booking.discount_amount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-lg border-t pt-3 mt-3">
                  <span>Total</span>
                  <span className="text-orange-600">
                    €{parseFloat(booking.total_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Customer Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium text-gray-900 text-right">
                    {booking.first_name} {booking.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium text-gray-900 text-right break-all">
                    {booking.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium text-gray-900 text-right">
                    {booking.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

          <div className="mt-10 text-center">
            <Link
              href="/"
              className="inline-block bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading booking confirmation...</p>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}

