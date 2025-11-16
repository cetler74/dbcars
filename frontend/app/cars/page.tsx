'use client';

import { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getVehicles, getLocations } from '@/lib/api';
import VehicleCard from '@/components/VehicleCard';

type SortOption = 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'name_asc' | 'name_desc';

function CarsPageContent() {
  const searchParams = useSearchParams();
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    make: '',
    location: searchParams.get('location') || '',
    available_from: searchParams.get('available_from') || '',
    available_to: searchParams.get('available_to') || '',
    min_price: '',
    max_price: '',
    transmission: '',
    fuel_type: '',
    seats: '',
    year_min: '',
    year_max: '',
  });
  const [sortBy, setSortBy] = useState<SortOption>('price_low');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  // Get unique makes/brands from vehicles
  const uniqueMakes = useMemo(() => {
    const makes = new Set(allVehicles.map((v) => v.make).filter(Boolean));
    return Array.from(makes).sort();
  }, [allVehicles]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFilters]);

  useEffect(() => {
    // Update filters from URL params on mount
    const locationParam = searchParams.get('location');
    const fromParam = searchParams.get('available_from');
    const toParam = searchParams.get('available_to');
    
    if (locationParam || fromParam || toParam) {
      setFilters({
        category: '',
        location: locationParam || '',
        available_from: fromParam || '',
        available_to: toParam || '',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.location, filters.available_from, filters.available_to, filters.min_price, filters.max_price]);

  const loadData = async () => {
    setLoading(true);
    try {
      const apiFilters: any = {
        category: filters.category || undefined,
        location: filters.location || undefined,
        available_from: filters.available_from || undefined,
        available_to: filters.available_to || undefined,
        min_price: filters.min_price ? Number(filters.min_price) : undefined,
        max_price: filters.max_price ? Number(filters.max_price) : undefined,
      };
      
      const [vehiclesData, locationsData] = await Promise.all([
        getVehicles(apiFilters),
        getLocations(),
      ]);
      setAllVehicles(vehiclesData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      make: '',
      location: '',
      available_from: '',
      available_to: '',
      min_price: '',
      max_price: '',
      transmission: '',
      fuel_type: '',
      seats: '',
      year_min: '',
      year_max: '',
    });
    setSearchQuery('');
  };

  // Get active filters count (excluding location and dates which are in header)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.make) count++;
    if (filters.transmission) count++;
    if (filters.fuel_type) count++;
    if (filters.seats) count++;
    if (filters.year_min) count++;
    if (filters.year_max) count++;
    if (filters.min_price) count++;
    if (filters.max_price) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [filters, searchQuery]);

  // Filter and sort vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = [...allVehicles];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((v) =>
        `${v.make} ${v.model}`.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query)
      );
    }

    // Apply client-side filters
    if (filters.make) {
      filtered = filtered.filter((v) => v.make === filters.make);
    }
    if (filters.transmission) {
      filtered = filtered.filter((v) => v.transmission === filters.transmission);
    }
    if (filters.fuel_type) {
      filtered = filtered.filter((v) => v.fuel_type === filters.fuel_type);
    }
    if (filters.seats) {
      filtered = filtered.filter((v) => v.seats === Number(filters.seats));
    }
    if (filters.year_min) {
      filtered = filtered.filter((v) => v.year >= Number(filters.year_min));
    }
    if (filters.year_max) {
      filtered = filtered.filter((v) => v.year <= Number(filters.year_max));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return (a.base_price_daily || 0) - (b.base_price_daily || 0);
        case 'price_high':
          return (b.base_price_daily || 0) - (a.base_price_daily || 0);
        case 'year_new':
          return (b.year || 0) - (a.year || 0);
        case 'year_old':
          return (a.year || 0) - (b.year || 0);
        case 'name_asc':
          return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
        case 'name_desc':
          return `${b.make} ${b.model}`.localeCompare(`${a.make} ${a.model}`);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allVehicles, filters.make, filters.transmission, filters.fuel_type, filters.seats, filters.year_min, filters.year_max, sortBy, searchQuery]);

  // Get active filter labels for display
  const getActiveFilterLabel = (key: string, value: string) => {
    switch (key) {
      case 'category':
        return value === 'luxury' ? 'Luxury' : value === 'super_luxury' ? 'Super Luxury' : 'Exotic';
      case 'make':
        return value;
      case 'location':
        const loc = locations.find((l) => l.id === value);
        return loc ? `${loc.name} - ${loc.city}` : '';
      case 'transmission':
        return value === 'automatic' ? 'Automatic' : 'Manual';
      case 'fuel_type':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'seats':
        return `${value} Seats`;
      case 'year_min':
        return `Year: ${value}+`;
      case 'year_max':
        return `Year: ≤${value}`;
      case 'min_price':
        return `Min: €${value}/day`;
      case 'max_price':
        return `Max: €${value}/day`;
      case 'available_from':
        return `From: ${new Date(value).toLocaleDateString()}`;
      case 'available_to':
        return `To: ${new Date(value).toLocaleDateString()}`;
      default:
        return value;
    }
  };

  const removeFilter = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/hero-cars.jpg"
            alt="Luxury car collection"
            fill
            className="object-cover"
            priority
            quality={90}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60"></div>
        </div>
        <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
              Our Cars
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Discover our premium collection of luxury vehicles
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Quick Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by make, model, or description..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
            
            {/* Sort and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="year_new">Year: Newest</option>
                  <option value="year_old">Year: Oldest</option>
                  <option value="name_asc">Name: A-Z</option>
                  <option value="name_desc">Name: Z-A</option>
                </select>
              </div>
              
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                
                {/* Dropdown Filters Menu */}
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Brand/Make */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Brand</label>
                          <select
                            value={filters.make}
                            onChange={(e) => handleFilterChange('make', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            <option value="">All Brands</option>
                            {uniqueMakes.map((make) => (
                              <option key={make} value={make}>
                                {make}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
                          <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            <option value="">All Categories</option>
                            <option value="luxury">Luxury</option>
                            <option value="super_luxury">Super Luxury</option>
                            <option value="exotic">Exotic</option>
                          </select>
                        </div>

                        {/* Transmission */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Transmission</label>
                          <select
                            value={filters.transmission}
                            onChange={(e) => handleFilterChange('transmission', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            <option value="">All Types</option>
                            <option value="automatic">Automatic</option>
                            <option value="manual">Manual</option>
                          </select>
                        </div>

                        {/* Fuel Type */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Fuel Type</label>
                          <select
                            value={filters.fuel_type}
                            onChange={(e) => handleFilterChange('fuel_type', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            <option value="">All Types</option>
                            <option value="gasoline">Gasoline</option>
                            <option value="diesel">Diesel</option>
                            <option value="electric">Electric</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </div>

                        {/* Seats */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Seats</label>
                          <select
                            value={filters.seats}
                            onChange={(e) => handleFilterChange('seats', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            <option value="">All</option>
                            <option value="2">2 Seats</option>
                            <option value="4">4 Seats</option>
                            <option value="5">5 Seats</option>
                            <option value="7">7 Seats</option>
                          </select>
                        </div>

                        {/* Year Range */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Year Min</label>
                            <input
                              type="number"
                              value={filters.year_min}
                              onChange={(e) => handleFilterChange('year_min', e.target.value)}
                              placeholder="2000"
                              min="1900"
                              max={new Date().getFullYear()}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Year Max</label>
                            <input
                              type="number"
                              value={filters.year_max}
                              onChange={(e) => handleFilterChange('year_max', e.target.value)}
                              placeholder={new Date().getFullYear().toString()}
                              min="1900"
                              max={new Date().getFullYear()}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Price Range */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Min Price</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                              <input
                                type="number"
                                value={filters.min_price}
                                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Max Price</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                              <input
                                type="number"
                                value={filters.max_price}
                                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                                placeholder="∞"
                                min="0"
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>


                        {/* Clear Filters Button */}
                        {activeFiltersCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Category Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Quick filters:</span>
              <button
                onClick={() => handleFilterChange('category', filters.category === 'luxury' ? '' : 'luxury')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.category === 'luxury'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Luxury
              </button>
              <button
                onClick={() => handleFilterChange('category', filters.category === 'super_luxury' ? '' : 'super_luxury')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.category === 'super_luxury'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Super Luxury
              </button>
              <button
                onClick={() => handleFilterChange('category', filters.category === 'exotic' ? '' : 'exotic')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.category === 'exotic'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Exotic
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="ml-auto px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Chips */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-gray-900">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {Object.entries(filters).map(([key, value]) => {
                  // Exclude location and dates from active filter chips (they're in header)
                  if (!value || key === 'location' || key === 'available_from' || key === 'available_to') return null;
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                    >
                      {getActiveFilterLabel(key, value)}
                      <button onClick={() => removeFilter(key)} className="hover:text-gray-900">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {loading ? (
              <span className="text-gray-500">Loading vehicles...</span>
            ) : (
              <>
                <span className="text-gray-900">{filteredAndSortedVehicles.length}</span>
                <span className="text-gray-600"> vehicle{filteredAndSortedVehicles.length !== 1 ? 's' : ''} found</span>
              </>
            )}
          </h2>
        </div>


        {/* Vehicles Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading vehicles...</p>
          </div>
        ) : filteredAndSortedVehicles.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search query.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedVehicles.map((vehicle, index) => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle}
                priority={index < 6}
                searchParams={{
                  location: searchParams.get('location'),
                  available_from: searchParams.get('available_from'),
                  available_to: searchParams.get('available_to'),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CarsPageContent />
    </Suspense>
  );
}

