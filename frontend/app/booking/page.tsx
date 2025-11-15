'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getVehicle } from '@/lib/api';
import BookingForm from '@/components/BookingForm';
import Link from 'next/link';

function BookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vehicleId = searchParams.get('vehicle_id');
  const pickupDateParam = searchParams.get('pickup_date');
  const dropoffDateParam = searchParams.get('dropoff_date');
  const pickupLocationParam = searchParams.get('pickup_location');
  const dropoffLocationParam = searchParams.get('dropoff_location');
  
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get dropoff location from URL params or localStorage as fallback
  const getDropoffLocation = () => {
    if (dropoffLocationParam) {
      return dropoffLocationParam;
    }
    // Fallback to localStorage
    try {
      const savedData = localStorage.getItem('carSearchData');
      if (savedData) {
        const searchData = JSON.parse(savedData);
        return searchData.dropoff_location_id || '';
      }
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
    return '';
  };

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    } else {
      // Redirect to cars page if no vehicle ID
      router.push('/cars');
    }
  }, [vehicleId, router]);

  const loadVehicle = async () => {
    try {
      const data = await getVehicle(vehicleId!);
      setVehicle(data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      router.push('/cars');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Loading booking form...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">Vehicle not found</p>
        <Link href="/cars" className="text-blue-600 hover:underline">
          ← Back to Fleet
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <Link href="/cars" className="hover:text-gray-900">Fleet</Link>
          <span>/</span>
          <Link href={`/cars/${vehicle.id}`} className="hover:text-gray-900">
            {vehicle.make} {vehicle.model}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Booking</span>
        </div>
      </nav>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Booking Form */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Complete Your Booking</h1>
        <p className="text-gray-600 mb-8">
          Booking: {vehicle.make} {vehicle.model}
        </p>
        <BookingForm 
          vehicle={vehicle}
          initialPickupDate={pickupDateParam ? new Date(pickupDateParam) : null}
          initialDropoffDate={dropoffDateParam ? new Date(dropoffDateParam) : null}
          initialPickupLocation={pickupLocationParam || ''}
          initialDropoffLocation={getDropoffLocation()}
        />
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}

