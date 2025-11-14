'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBooking } from '@/lib/api';
import Link from 'next/link';

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingNumber = searchParams.get('bookingNumber');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading booking confirmation...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Booking not found</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your booking has been successfully confirmed. Booking Number:
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{booking.booking_number}</p>
        </div>

        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Vehicle:</span>
                <p className="font-medium">
                  {booking.make} {booking.model} ({booking.year})
                </p>
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Rental Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Pick-up Location:</span>
                <p className="font-medium">{booking.pickup_location_name}</p>
                <p className="text-sm text-gray-500">{booking.pickup_location_address}</p>
              </div>
              <div>
                <span className="text-gray-600">Drop-off Location:</span>
                <p className="font-medium">{booking.dropoff_location_name}</p>
                <p className="text-sm text-gray-500">{booking.dropoff_location_address}</p>
              </div>
              <div>
                <span className="text-gray-600">Pick-up Date:</span>
                <p className="font-medium">
                  {new Date(booking.pickup_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Drop-off Date:</span>
                <p className="font-medium">
                  {new Date(booking.dropoff_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium">
                  {booking.first_name} {booking.last_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">{booking.email}</p>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <p className="font-medium">{booking.phone}</p>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Pricing Summary</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span>€{parseFloat(booking.base_price).toFixed(2)}</span>
              </div>
              {booking.extras_price > 0 && (
                <div className="flex justify-between">
                  <span>Extras:</span>
                  <span>€{parseFloat(booking.extras_price).toFixed(2)}</span>
                </div>
              )}
              {booking.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-€{parseFloat(booking.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total:</span>
                <span>€{parseFloat(booking.total_price).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-600">Booking Status:</span>
                <p className="font-medium capitalize">{booking.status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Return to Home
          </Link>
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

