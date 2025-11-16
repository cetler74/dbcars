'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocations } from '@/lib/api';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [dropoffDate, setDropoffDate] = useState<Date | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Memoize computed values to prevent unnecessary re-renders
  const isHomePage = useMemo(() => pathname === '/', [pathname]);
  const isAdminPage = useMemo(() => pathname?.startsWith('/admin'), [pathname]);
  const isAboutPage = useMemo(() => pathname === '/about', [pathname]);
  const isCarsListingPage = useMemo(() => pathname === '/cars', [pathname]);
  const isCarsPage = useMemo(() => pathname === '/cars' || pathname?.startsWith('/cars/'), [pathname]);
  const isBlogPage = useMemo(() => pathname === '/blog' || pathname?.startsWith('/blog/'), [pathname]);
  const hasHeroSection = isHomePage;

  // Load locations only when needed (memoized to prevent unnecessary calls)
  useEffect(() => {
    if (isCarsListingPage && locations.length === 0) {
      getLocations().then(setLocations).catch(console.error);
    }
  }, [isCarsListingPage, locations.length]);

  // Load from URL params on mount
  useEffect(() => {
    if (isCarsListingPage) {
      const locationParam = searchParams.get('location') || '';
      const fromParam = searchParams.get('available_from') || '';
      const toParam = searchParams.get('available_to') || '';
      
      setPickupLocation(locationParam);
      setPickupDate(fromParam ? new Date(fromParam) : null);
      setDropoffDate(toParam ? new Date(toParam) : null);
    } else {
      // Reset when leaving cars page
      setPickupLocation('');
      setPickupDate(null);
      setDropoffDate(null);
    }
  }, [isCarsListingPage, searchParams]);

  // Save to localStorage and update URL when filters change (debounced to avoid infinite loops)
  useEffect(() => {
    if (!isCarsListingPage || typeof window === 'undefined') return;
    
    const timeoutId = setTimeout(() => {
      try {
        // Save to localStorage for persistence across pages
        if (pickupLocation || pickupDate || dropoffDate) {
          const searchData = {
            pickup_location_id: pickupLocation,
            pickup_date: pickupDate ? pickupDate.toISOString() : null,
            dropoff_date: dropoffDate ? dropoffDate.toISOString() : null,
          };
          localStorage.setItem('carSearchData', JSON.stringify(searchData));
        }
        
        const params = new URLSearchParams(searchParams.toString());
        let hasChanges = false;
        
        const currentLocation = params.get('location') || '';
        const currentFrom = params.get('available_from') || '';
        const currentTo = params.get('available_to') || '';
        
        if (pickupLocation) {
          if (currentLocation !== pickupLocation) {
            params.set('location', pickupLocation);
            hasChanges = true;
          }
        } else {
          if (currentLocation) {
            params.delete('location');
            hasChanges = true;
          }
        }
        
        if (pickupDate) {
          const dateStr = pickupDate.toISOString().split('T')[0];
          if (currentFrom !== dateStr) {
            params.set('available_from', dateStr);
            hasChanges = true;
          }
        } else {
          if (currentFrom) {
            params.delete('available_from');
            hasChanges = true;
          }
        }
        
        if (dropoffDate) {
          const dateStr = dropoffDate.toISOString().split('T')[0];
          if (currentTo !== dateStr) {
            params.set('available_to', dateStr);
            hasChanges = true;
          }
        } else {
          if (currentTo) {
            params.delete('available_to');
            hasChanges = true;
          }
        }
        
        // Only push if there are actual changes to avoid infinite loops
        if (hasChanges) {
          const newUrl = `/cars?${params.toString()}`;
          const currentUrl = window.location.pathname + window.location.search;
          if (currentUrl !== newUrl) {
            router.push(newUrl);
          }
        }
      } catch (error) {
        console.error('Error updating URL params:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation, pickupDate, dropoffDate, isCarsListingPage]);

  // Don't show header on admin pages
  if (isAdminPage) {
    return null;
  }

  return (
    <header
      className="sticky top-0 z-50 transition-all bg-black shadow-sm"
    >
      <nav className="container mx-auto px-4 md:px-6 py-4 bg-transparent">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            prefetch={true}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/logodb.png"
              alt="DB Luxury Cars"
              width={200}
              height={80}
              className="h-14 md:h-16 lg:h-20 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>

          {/* Location and Date Fields (only on cars listing page) */}
          {isCarsListingPage && (
            <div className="hidden lg:flex items-center gap-3 flex-1 max-w-2xl mx-8">
              {/* Pickup Location */}
              <div className="flex-1">
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="">Pickup Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} - {loc.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pickup Date */}
              <div className="flex-1">
                <DatePicker
                  selected={pickupDate}
                  onChange={(date: Date | null) => setPickupDate(date)}
                  minDate={new Date()}
                  placeholderText="Pickup Date"
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  wrapperClassName="w-full"
                />
              </div>

              {/* Dropoff Date */}
              <div className="flex-1">
                <DatePicker
                  selected={dropoffDate}
                  onChange={(date: Date | null) => setDropoffDate(date)}
                  minDate={pickupDate || new Date()}
                  placeholderText="Dropoff Date"
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              Home
            </Link>
          <Link
            href="/about"
            prefetch={true}
            className="transition-colors font-medium text-white hover:text-gray-200"
          >
            About us
          </Link>
            <Link
              href="/cars"
              prefetch={true}
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              Our Cars
            </Link>
            <Link
              href="/blog"
              prefetch={true}
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              Blog
            </Link>
            <Link
              href="/faq"
              prefetch={true}
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              prefetch={true}
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              Contacts
            </Link>
            <Link
              href="/admin"
              prefetch={true}
              className="px-5 py-2 rounded-md transition-colors font-medium bg-white text-black hover:bg-gray-100"
            >
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden transition-colors text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Location and Date Fields (only on cars listing page) */}
        {isCarsListingPage && (
          <div className="lg:hidden mt-4 space-y-3 pb-4">
            {/* Pickup Location */}
            <div>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="">Pickup Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} - {loc.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <DatePicker
                  selected={pickupDate}
                  onChange={(date: Date | null) => setPickupDate(date)}
                  minDate={new Date()}
                  placeholderText="Pickup Date"
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  wrapperClassName="w-full"
                />
              </div>
              <div>
                <DatePicker
                  selected={dropoffDate}
                  onChange={(date: Date | null) => setDropoffDate(date)}
                  minDate={pickupDate || new Date()}
                  placeholderText="Dropoff Date"
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4 pb-4">
            <Link
              href="/"
              className="block font-medium transition-colors text-white hover:text-gray-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="block font-medium transition-colors text-white hover:text-gray-200"
              onClick={() => setIsMenuOpen(false)}
            >
              About us
            </Link>
            <Link
              href="/cars"
              className="block font-medium transition-colors text-white hover:text-gray-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Our Cars
            </Link>
            <Link
              href="/blog"
              className="block font-medium transition-colors text-white hover:text-gray-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/faq"
              className="block font-medium transition-colors text-white hover:text-gray-200"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="block font-medium transition-colors text-white hover:text-gray-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Contacts
            </Link>
            <Link
              href="/admin"
              className="block px-5 py-2 rounded-md transition-colors font-medium text-center bg-white text-black hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

