import Link from 'next/link';
import Image from 'next/image';

interface VehicleCardProps {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    category: string;
    base_price_daily: number;
    images?: string[];
    description?: string;
    transmission?: string;
    fuel_type?: string;
    seats?: number;
    features?: string[];
  };
  searchParams?: {
    location?: string | null;
    available_from?: string | null;
    available_to?: string | null;
  };
}

export default function VehicleCard({ vehicle, searchParams }: VehicleCardProps) {
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
        return 'bg-blue-100 text-blue-800';
      case 'super_luxury':
        return 'bg-purple-100 text-purple-800';
      case 'exotic':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const transmission = vehicle.transmission || 'automatic';
  const fuelType = vehicle.fuel_type || 'gasoline';
  const seats = vehicle.seats || 4;
  const imageUrl = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : null;

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

  // Build URL with preserved search params (location, dates)
  const getVehicleUrl = () => {
    if (!searchParams) return `/cars/${vehicle.id}`;
    
    const params = new URLSearchParams();
    if (searchParams.location) params.set('location', searchParams.location);
    if (searchParams.available_from) params.set('available_from', searchParams.available_from);
    if (searchParams.available_to) params.set('available_to', searchParams.available_to);
    
    const queryString = params.toString();
    return `/cars/${vehicle.id}${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <Link
      href={getVehicleUrl()}
      className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 block"
    >
      {/* Image Section */}
      <div className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {imageUrl ? (
          <>
            <Image
              src={getImageUrl(imageUrl) || ''}
              alt={`${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Image overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(vehicle.category)}`}>
            {getCategoryLabel(vehicle.category)}
          </span>
        </div>

        {/* Fuel Type Badge */}
        {(fuelType === 'hybrid' || fuelType === 'electric') && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white uppercase">
              {fuelType}
            </span>
          </div>
        )}

        {/* Image Count Indicator */}
        {vehicle.images && vehicle.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
            {vehicle.images.length} photos
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title and Year */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-sm text-gray-500 font-medium">{vehicle.year}</p>
        </div>

        {/* Quick Specs */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-medium">{seats}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium capitalize">{transmission}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium capitalize">{fuelType}</span>
          </div>
        </div>

        {/* Description Preview */}
        {vehicle.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {vehicle.description}
          </p>
        )}

        {/* Features Preview */}
        {vehicle.features && vehicle.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {vehicle.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs font-medium"
              >
                {feature}
              </span>
            ))}
            {vehicle.features.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs font-medium">
                +{vehicle.features.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              €{Number(vehicle.base_price_daily || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">per day</p>
          </div>
          <div className="flex items-center gap-2 text-gray-600 group-hover:text-gray-900 transition-colors">
            <span className="text-sm font-semibold">View Details</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

