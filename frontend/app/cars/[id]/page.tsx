'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVehicle, getVehicles, getLocations } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import VehicleCard from '@/components/VehicleCard';

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;
  const [vehicle, setVehicle] = useState<any>(null);
  const [similarVehicles, setSimilarVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Booking form state
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [dropoffDate, setDropoffDate] = useState<Date | null>(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  // Load saved search data when locations are available
  useEffect(() => {
    if (locations.length > 0) {
      loadSavedSearchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  // Load saved search data from URL params (priority) or localStorage
  const loadSavedSearchData = () => {
    try {
      // First check URL params (they take priority)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const locationParam = urlParams.get('location');
        const fromParam = urlParams.get('available_from');
        const toParam = urlParams.get('available_to');
        
        if (locationParam && locations.length > 0) {
          const locationExists = locations.some((loc: any) => loc.id === locationParam);
          if (locationExists) {
            setPickupLocation(locationParam);
          }
        }
        if (fromParam) {
          const date = new Date(fromParam);
          if (!isNaN(date.getTime())) {
            setPickupDate(date);
          }
        }
        if (toParam) {
          const date = new Date(toParam);
          if (!isNaN(date.getTime())) {
            setDropoffDate(date);
          }
        }
        
        // If we found location in URL params, we're done
        if (locationParam) {
          return;
        }
      }
      
      // Fallback to localStorage if no URL params
      const savedData = localStorage.getItem('carSearchData');
      if (savedData) {
        const searchData = JSON.parse(savedData);
        if (searchData.pickup_location_id && locations.length > 0) {
          // Verify location exists in locations list before setting
          const locationExists = locations.some((loc: any) => loc.id === searchData.pickup_location_id);
          if (locationExists) {
            setPickupLocation(searchData.pickup_location_id);
          }
        }
        if (searchData.dropoff_location_id && locations.length > 0) {
          // Verify location exists in locations list before setting
          const locationExists = locations.some((loc: any) => loc.id === searchData.dropoff_location_id);
          if (locationExists) {
            setDropoffLocation(searchData.dropoff_location_id);
          }
        }
        if (searchData.pickup_date) {
          const date = new Date(searchData.pickup_date);
          if (!isNaN(date.getTime())) {
            setPickupDate(date);
          }
        }
        if (searchData.dropoff_date) {
          const date = new Date(searchData.dropoff_date);
          if (!isNaN(date.getTime())) {
            setDropoffDate(date);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved search data:', error);
    }
  };

  const loadVehicle = async () => {
    try {
      const [vehicleData, locationsData, allVehiclesData] = await Promise.all([
        getVehicle(vehicleId),
        getLocations(),
        getVehicles({ category: '' }),
      ]);
      setVehicle(vehicleData);
      setLocations(locationsData);
      // Ensure selectedImageIndex is valid
      const images = Array.isArray(vehicleData.images) ? vehicleData.images : vehicleData.images ? [vehicleData.images] : [];
      setSelectedImageIndex(images.length > 0 ? 0 : 0);
      
      // Get similar vehicles (same category, exclude current vehicle)
      const similar = allVehiclesData
        .filter((v: any) => v.id !== vehicleId && v.category === vehicleData.category)
        .slice(0, 3);
      setSimilarVehicles(similar);
      
      // loadSavedSearchData will be called via useEffect when locations are set
    } catch (error: any) {
      console.error('Error loading vehicle:', error);
      // Show more detailed error information
      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.status === 404) {
          alert('Vehicle not found');
        } else if (error.response.status === 500) {
          alert('Server error. Please try again later.');
        } else {
          alert(`Error: ${error.response.data?.error || 'Failed to load vehicle'}`);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Unable to connect to server. Please check your connection.');
      } else {
        console.error('Error:', error.message);
        alert(`Error: ${error.message || 'Failed to load vehicle'}`);
      }
      router.push('/cars');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCalculatePrice = () => {
    if (pickupDate && dropoffDate && pickupLocation) {
      const params = new URLSearchParams({
        vehicle_id: vehicleId,
        pickup_date: pickupDate.toISOString().split('T')[0],
        dropoff_date: dropoffDate.toISOString().split('T')[0],
        pickup_location: pickupLocation,
      });
      // Include dropoff location if available
      if (dropoffLocation) {
        params.append('dropoff_location', dropoffLocation);
      }
      router.push(`/booking?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Loading vehicle details...</p>
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

  // Ensure images is always an array
  const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.images ? [vehicle.images] : [];
  const vehicleFeatures = Array.isArray(vehicle.features) ? vehicle.features : vehicle.features ? [vehicle.features] : [];
  
  // Ensure selectedImageIndex is within bounds
  const safeImageIndex = vehicleImages.length > 0 
    ? Math.min(selectedImageIndex, vehicleImages.length - 1) 
    : 0;

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span>/</span>
            <Link href="/cars" className="hover:text-gray-900">Fleet</Link>
            <span>/</span>
            <span className="text-gray-900">{vehicle.make} {vehicle.model}</span>
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
          Back to Fleet
        </button>

        {/* Main Layout: Left (Scrollable) + Right (Sticky) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Side - Scrollable Content */}
          <div className="flex-1 space-y-8 pb-12 w-full">
            {/* Image Gallery */}
            {vehicleImages && vehicleImages.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src={getImageUrl(vehicleImages[safeImageIndex]) || '/placeholder-car.jpg'}
                    alt={`${vehicle.make} ${vehicle.model} - Image ${safeImageIndex + 1}`}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                  {/* Navigation Arrows */}
                  {vehicleImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedImageIndex(
                            (prev) => (prev - 1 + vehicleImages.length) % vehicleImages.length
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        aria-label="Previous image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) => (prev + 1) % vehicleImages.length)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        aria-label="Next image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                  {/* Image Counter */}
                  {vehicleImages.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded text-sm">
                      {safeImageIndex + 1} / {vehicleImages.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {vehicleImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {vehicleImages.map((image: string, index: number) => {
                      const isSelected = index === safeImageIndex;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative w-24 h-24 flex-shrink-0 rounded overflow-hidden cursor-pointer border-2 transition-all ${
                            isSelected
                              ? 'border-yellow-400 ring-2 ring-yellow-200'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <Image
                            src={getImageUrl(image) || ''}
                            alt={`${vehicle.make} ${vehicle.model} - Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {index === 0 && (
                            <div className="absolute top-1 left-1">
                              <span className="bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded font-semibold">
                                Featured Vehicle
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
              </div>
            )}

            {/* Vehicle Name and Specs */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{vehicle.make} {vehicle.model}</h1>
              <p className="text-gray-600 mb-4">{vehicle.make} • {vehicle.category}</p>
              
              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold">€{Number(vehicle.base_price_daily || 0).toFixed(2)}</span>
                <span className="text-gray-600 ml-2">per day</span>
                <p className="text-sm text-yellow-600 mt-1">Price varies by duration</p>
              </div>

              {/* Quick Specs */}
              <div className="flex items-center gap-6 text-sm text-gray-700 mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{vehicle.seats || 'N/A'}</span>
                  <span>Seats</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize">{vehicle.transmission || 'N/A'}</span>
                  <span>Transmission</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize">{vehicle.fuel_type || 'N/A'}</span>
                  <span>Fuel Type</span>
                </div>
                {vehicle.power && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{vehicle.power}</span>
                    <span>HP</span>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            {vehicleFeatures && vehicleFeatures.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vehicleFeatures.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {vehicle.description && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
              </div>
            )}
          </div>

          {/* Right Side - Sticky Booking Widget */}
          <div className="lg:w-96 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 space-y-6">
              {/* Get Detailed Quote Section */}
              <div className="bg-yellow-50 p-6 rounded-lg space-y-4">
                <h3 className="text-xl font-semibold">Get Detailed Quote</h3>
                <p className="text-sm text-gray-700">Experience luxury with our premium concierge service</p>
                
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCalculatePrice(); }}>
                  {/* Vehicle (pre-filled) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                    <input
                      type="text"
                      value={`${vehicle.make} ${vehicle.model}`}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      selected={pickupDate}
                      onChange={(date: Date | null) => setPickupDate(date)}
                      minDate={new Date()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      dateFormat="dd/MM/yyyy"
                      placeholderText="dd/mm/yyyy"
                      required
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      selected={dropoffDate}
                      onChange={(date: Date | null) => setDropoffDate(date)}
                      minDate={pickupDate || new Date()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      dateFormat="dd/MM/yyyy"
                      placeholderText="dd/mm/yyyy"
                      required
                    />
                  </div>

                  {/* Pickup Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 appearance-none bg-white"
                        required
                      >
                        <option value="">Select pickup region</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} - {loc.city}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Calculate Button */}
                  <button
                    type="submit"
                    disabled={!pickupDate || !dropoffDate || !pickupLocation}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calculate My Price
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Vehicles - Separate Section */}
        {similarVehicles.length > 0 && (
          <div className="mt-12 w-full">
            <h2 className="text-2xl font-semibold mb-6">Similar Vehicles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {similarVehicles.map((v: any) => (
                            <VehicleCard 
                              key={v.id} 
                              vehicle={v}
                              searchParams={undefined}
                            />
                          ))}
                        </div>
          </div>
        )}
      </div>
    </div>
  );
}
