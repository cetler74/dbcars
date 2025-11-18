'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface FeaturedCarCardProps {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year?: number;
    base_price_daily: number;
    images?: string[];
  };
  priority?: boolean;
}

export default function FeaturedCarCard({ vehicle, priority = false }: FeaturedCarCardProps) {
  const [imageError, setImageError] = useState(false);
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

  return (
    <Link
      href={`/cars/${vehicle.id}`}
      className="relative block overflow-hidden rounded-2xl bg-black shadow-2xl transform transition-transform hover:scale-[1.02]"
    >
      {/* Image Section - Takes 90% of card space */}
      <div className="relative w-full aspect-[3/2] overflow-hidden">
        {imageUrl && !imageError ? (
          <>
            <Image
              src={getImageUrl(imageUrl) || ''}
              alt={`${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              quality={95}
              unoptimized
              onError={() => setImageError(true)}
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 via-black/5 to-transparent opacity-100" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <svg className="w-20 h-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Car Name - Top Left Corner */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8 z-10">
          <div className="mb-1">
            <h3 className="text-base md:text-lg font-semibold text-white/95 mb-0.5 tracking-tight leading-tight">
              {vehicle.make} {vehicle.model}
            </h3>
          </div>
          {vehicle.year && (
            <p className="text-xs text-white/50 font-light tracking-wide">{vehicle.year}</p>
          )}
        </div>

        {/* Price - Top Right Corner */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 z-10 text-right">
          <div className="mb-0.5">
            <p className="text-base md:text-lg font-semibold text-white/95 tracking-tight leading-none">
              €{Number(vehicle.base_price_daily || 0).toFixed(0)}
            </p>
          </div>
          <p className="text-[10px] text-white/40 font-light uppercase tracking-[0.15em]">
            per day
          </p>
        </div>
      </div>
    </Link>
  );
}

