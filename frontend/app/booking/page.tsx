'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getVehicle } from '@/lib/api';
import BookingForm from '@/components/BookingForm';
import Link from 'next/link';
import Image from 'next/image';

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
  const [currentStep, setCurrentStep] = useState(1);
  
  // Stable callback for step changes
  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);
  
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

  // Helper function to get full image URL
  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

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

  // Get vehicle images
  const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.images ? [vehicle.images] : [];
  const mainImage = vehicleImages.length > 0 ? vehicleImages[0] : null;
  const showVehicleCard = currentStep === 1;

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 pt-8 pb-12">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/cars" className="hover:text-gray-900 transition-colors">Fleet</Link>
            <span>/</span>
            <Link href={`/cars/${vehicle.id}`} className="hover:text-gray-900 transition-colors">
              {vehicle.make} {vehicle.model}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Booking</span>
          </div>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">Complete Your Booking</h1>
          <p className="text-lg text-gray-600">
            Booking: <span className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</span>
          </p>
        </div>

        {/* Main Content: Image + Form */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Left Side - Vehicle Image (only on step 1) */}
          {showVehicleCard && (
            <div className="w-full lg:w-1/2 lg:sticky lg:top-6">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-full flex flex-col justify-center">
                {mainImage ? (
                  <div className="relative w-full h-[320px] lg:h-[380px]">
                    <Image
                      src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover"
                      priority
                      quality={90}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full h-[320px] lg:h-[380px] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 text-lg">No Image Available</span>
                  </div>
                )}
                
                {/* Vehicle Info Card */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {vehicle.make} {vehicle.model}
                      </h2>
                      {vehicle.year && (
                        <p className="text-gray-600 text-sm">{vehicle.year}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-orange-600">
                        €{Number(vehicle.base_price_daily || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">per day</p>
                    </div>
                  </div>
                  
                  {/* Quick Specs */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-medium">{vehicle.seats || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="font-medium capitalize">{vehicle.transmission || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-medium capitalize">{vehicle.fuel_type || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Side - Booking Form */}
          <div className={`w-full ${showVehicleCard ? 'lg:w-1/2' : 'lg:w-full'} flex`}>
            <BookingForm 
              vehicle={vehicle}
              initialPickupDate={pickupDateParam ? new Date(pickupDateParam) : null}
              initialDropoffDate={dropoffDateParam ? new Date(dropoffDateParam) : null}
              initialPickupLocation={pickupLocationParam || ''}
              initialDropoffLocation={getDropoffLocation()}
              onStepChange={handleStepChange}
            />
          </div>
        </div>
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

