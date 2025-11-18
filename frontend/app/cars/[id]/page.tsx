'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVehicle, getVehicles, getLocations, getVehicleBlockedDates } from '@/lib/api';
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
  const [pickupTime, setPickupTime] = useState<string>('');
  const [dropoffTime, setDropoffTime] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  
  // Blocked dates state
  const [blockedDatesData, setBlockedDatesData] = useState<any>(null);

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
      loadBlockedDates();
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
      let pickupLocationId = '';
      let dropoffLocationId = '';
      let wasShowReturnLocation = false;
      
      // First check URL params (they take priority)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const locationParam = urlParams.get('location');
        const fromParam = urlParams.get('available_from');
        const toParam = urlParams.get('available_to');
        
        if (locationParam && locations.length > 0) {
          const locationExists = locations.some((loc: any) => String(loc.id) === String(locationParam));
          if (locationExists) {
            pickupLocationId = locationParam;
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
      }
      
      // Then check localStorage
      const savedData = localStorage.getItem('carSearchData');
      if (savedData) {
        const searchData = JSON.parse(savedData);
        
        // Save the showReturnLocation state
        wasShowReturnLocation = searchData.showReturnLocation || false;
        
        // Use pickup location from localStorage if not set from URL
        if (!pickupLocationId && searchData.pickup_location_id && locations.length > 0) {
          const locationExists = locations.some((loc: any) => String(loc.id) === String(searchData.pickup_location_id));
          if (locationExists) {
            pickupLocationId = searchData.pickup_location_id;
            setPickupLocation(searchData.pickup_location_id);
          }
        }
        
        // Use dropoff location from localStorage if available
        if (searchData.dropoff_location_id && locations.length > 0) {
          const locationExists = locations.some((loc: any) => String(loc.id) === String(searchData.dropoff_location_id));
          if (locationExists) {
            dropoffLocationId = searchData.dropoff_location_id;
            setDropoffLocation(searchData.dropoff_location_id);
          }
        }
        
        // Load dates from localStorage if not already set
        if (!pickupDate && searchData.pickup_date) {
          const date = new Date(searchData.pickup_date);
          if (!isNaN(date.getTime())) {
            setPickupDate(date);
            // Extract and set time
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            setPickupTime(`${hours}:${minutes}`);
          }
        }
        if (!dropoffDate && searchData.dropoff_date) {
          const date = new Date(searchData.dropoff_date);
          if (!isNaN(date.getTime())) {
            setDropoffDate(date);
            // Extract and set time
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            setDropoffTime(`${hours}:${minutes}`);
          }
        }
      }
      
      // Only use pickup location for dropoff if user selected SAME location
      // (i.e., they didn't click "Different return")
      if (!wasShowReturnLocation && pickupLocationId && !dropoffLocationId) {
        // User wants same location for both pickup and dropoff
        setDropoffLocation(pickupLocationId);
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

  const loadBlockedDates = async () => {
    try {
      // Load blocked dates for the next 12 months
      const data = await getVehicleBlockedDates(vehicleId);
      setBlockedDatesData(data);
      console.log('Loaded blocked dates for vehicle:', vehicleId, data);
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    }
  };

  // Helper function to check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    if (!blockedDatesData) return true;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check blocked dates (maintenance/blocked notes)
    if (blockedDatesData.blocked_dates) {
      const isBlocked = blockedDatesData.blocked_dates.some((note: any) => {
        const noteDate = new Date(note.note_date).toISOString().split('T')[0];
        return dateStr === noteDate;
      });
      if (isBlocked) return false;
    }
    
    // Check if date falls within any booking
    if (blockedDatesData.bookings) {
      const isBooked = blockedDatesData.bookings.some((booking: any) => {
        const pickupDate = new Date(booking.pickup_date).toISOString().split('T')[0];
        const dropoffDate = new Date(booking.dropoff_date).toISOString().split('T')[0];
        return dateStr >= pickupDate && dateStr <= dropoffDate;
      });
      if (isBooked) return false;
    }
    
    return true;
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

  // Get category label and color
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'luxury':
        return 'Luxury';
      case 'super_luxury':
        return 'Super Luxury';
      case 'exotic':
        return 'Exotic';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'luxury':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'super_luxury':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'exotic':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/cars" className="hover:text-gray-900 transition-colors">Fleet</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{vehicle.make} {vehicle.model}</span>
          </div>
        </nav>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-8 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"
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
                <div className="relative w-full h-[420px] lg:h-[520px] rounded-xl overflow-hidden shadow-2xl bg-gray-900">
                  <Image
                    src={getImageUrl(vehicleImages[safeImageIndex]) || '/placeholder-car.jpg'}
                    alt={`${vehicle.make} ${vehicle.model} - Image ${safeImageIndex + 1}`}
                    fill
                    className="object-cover"
                    priority
                    quality={90}
                    unoptimized
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  
                  {/* Navigation Arrows */}
                  {vehicleImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedImageIndex(
                            (prev) => (prev - 1 + vehicleImages.length) % vehicleImages.length
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full transition-all shadow-lg hover:scale-110 z-10"
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full transition-all shadow-lg hover:scale-110 z-10"
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
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium">
                      {safeImageIndex + 1} / {vehicleImages.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {vehicleImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {vehicleImages.map((image: string, index: number) => {
                      const isSelected = index === safeImageIndex;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shadow-md hover:shadow-lg ${
                            isSelected
                              ? 'border-orange-500 ring-2 ring-orange-200 scale-105'
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
                            <div className="absolute top-2 left-2">
                              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-semibold shadow-md">
                                Cover
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
              <div className="w-full h-[420px] lg:h-[520px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-gray-500 text-lg">No Image Available</span>
              </div>
            )}

            {/* Vehicle Header Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(vehicle.category)}`}>
                      {getCategoryLabel(vehicle.category)}
                    </span>
                    {vehicle.year && (
                      <span className="text-gray-500 text-sm">{vehicle.year}</span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
                    {vehicle.make} {vehicle.model}
                  </h1>
                  {vehicle.color && (
                    <p className="text-gray-600 text-sm">Color: <span className="font-semibold capitalize">{vehicle.color}</span></p>
                  )}
                </div>
              
                {/* Price Card */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
                  <p className="text-xs font-medium mb-1 opacity-90">Starting from</p>
                  <p className="text-2xl font-bold mb-1">€{Number(vehicle.base_price_daily || 0).toFixed(2)}</p>
                  <p className="text-xs opacity-90">per day</p>
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{vehicle.seats || 'N/A'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Seats</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-gray-900 capitalize">{vehicle.transmission || 'N/A'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Transmission</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-gray-900 capitalize">{vehicle.fuel_type || 'N/A'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Fuel Type</p>
                </div>
                {vehicle.power ? (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex justify-center mb-1">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{vehicle.power}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Horsepower</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex justify-center mb-1">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-base font-bold text-gray-900">{vehicle.year || 'N/A'}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Year</p>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            {vehicleFeatures && vehicleFeatures.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">Features & Amenities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicleFeatures.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {vehicle.description && (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">About This Vehicle</h2>
                <p className="text-gray-700 leading-relaxed text-lg">{vehicle.description}</p>
              </div>
            )}
          </div>

          {/* Right Side - Sticky Booking Widget */}
          <div className="lg:w-96 lg:sticky lg:top-32 lg:self-start">
            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-6 space-y-6">
              {/* Get Detailed Quote Section */}
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-1">Get Detailed Quote</h3>
                  <p className="text-sm text-gray-500">
                    Experience luxury with our premium concierge service.
                  </p>
                </div>
                
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCalculatePrice();
                  }}
                >
                  {/* Vehicle (pre-filled) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Vehicle
                    </label>
                    <input
                      type="text"
                      value={`${vehicle.make} ${vehicle.model}`}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>

                  {/* Start Date & Time */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Start Date & Time <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 items-stretch">
                      {/* Time Picker - appears first */}
                      <div className="w-28 flex-shrink-0">
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => {
                            setPickupTime(e.target.value);
                            // Update the date with new time
                            if (pickupDate && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(pickupDate);
                              newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                              setPickupDate(newDate);
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-[42px]"
                          required
                        />
                      </div>
                      {/* Date Picker - appears after time */}
                      <div className="flex-1">
                        <DatePicker
                          selected={pickupDate}
                          onChange={(date: Date | null) => {
                            if (date) {
                              // Preserve time if it was set
                              if (pickupTime) {
                                const [hours, minutes] = pickupTime.split(':');
                                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                              }
                            }
                            setPickupDate(date);
                            // If dropoff date is same day or before new pickup date, reset it
                            if (date && dropoffDate && dropoffDate <= date) {
                              setDropoffDate(null);
                            }
                          }}
                          minDate={new Date()}
                          filterDate={isDateAvailable}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="dd/mm/yyyy"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-[42px]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Date & Time */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      End Date & Time <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 items-stretch">
                      {/* Time Picker - appears first */}
                      <div className="w-28 flex-shrink-0">
                        <input
                          type="time"
                          value={dropoffTime}
                          onChange={(e) => {
                            setDropoffTime(e.target.value);
                            // Update the date with new time
                            if (dropoffDate && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(dropoffDate);
                              newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                              setDropoffDate(newDate);
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-[42px]"
                          required
                        />
                      </div>
                      {/* Date Picker - appears after time */}
                      <div className="flex-1">
                        <DatePicker
                          selected={dropoffDate}
                          onChange={(date: Date | null) => {
                            if (date) {
                              // Preserve time if it was set
                              if (dropoffTime) {
                                const [hours, minutes] = dropoffTime.split(':');
                                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                              }
                              // Validate minimum 1 day rental period
                              if (pickupDate) {
                                const timeDiff = date.getTime() - pickupDate.getTime();
                                const hoursDiff = timeDiff / (1000 * 60 * 60);
                                if (hoursDiff < 24) {
                                  // If less than 24 hours, set to exactly 24 hours after pickup
                                  const minDropoffDate = new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000);
                                  if (dropoffTime) {
                                    const [hours, minutes] = dropoffTime.split(':');
                                    minDropoffDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                  }
                                  setDropoffDate(minDropoffDate);
                                  return;
                                }
                              }
                            }
                            setDropoffDate(date);
                          }}
                          minDate={
                            pickupDate
                              ? (() => {
                                  // Minimum date is the day after pickup (to ensure 24+ hours)
                                  const minDate = new Date(pickupDate);
                                  minDate.setDate(minDate.getDate() + 1);
                                  return minDate;
                                })()
                              : new Date()
                          }
                          filterDate={(date: Date) => {
                            if (!pickupDate) return isDateAvailable(date);
                            // Prevent selecting same day as pickup
                            if (date.toDateString() === pickupDate.toDateString()) {
                              return false;
                            }
                            return isDateAvailable(date);
                          }}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="dd/mm/yyyy"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-[42px]"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum rental period is 1 day (24 hours)</p>
                    {pickupDate && dropoffDate && (() => {
                      const timeDiff = dropoffDate.getTime() - pickupDate.getTime();
                      const hoursDiff = timeDiff / (1000 * 60 * 60);
                      if (hoursDiff < 24) {
                        return (
                          <p className="text-xs text-red-500 mt-1">
                            Rental period must be at least 24 hours. Current: {Math.round(hoursDiff * 10) / 10} hours
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Pickup Location */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Pickup Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                        required
                      >
                        <option value="">Select pickup region</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} - {loc.city}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Dropoff Location */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Dropoff Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={dropoffLocation}
                        onChange={(e) => setDropoffLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                        required
                      >
                        <option value="">Select dropoff region</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} - {loc.city}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Calculate Button */}
                  <button
                    type="submit"
                    disabled={!pickupDate || !dropoffDate || !pickupLocation || !dropoffLocation}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
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
          <div className="mt-16 w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Similar Vehicles</h2>
              <p className="text-gray-600">Explore other vehicles in the same category</p>
            </div>
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
