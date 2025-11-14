'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getVehicles, getLocations } from '@/lib/api';
import VehicleCard from '@/components/VehicleCard';

function CarsPageContent() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    location: searchParams.get('location') || '',
    available_from: searchParams.get('available_from') || '',
    available_to: searchParams.get('available_to') || '',
  });
  const [loading, setLoading] = useState(true);

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
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiclesData, locationsData] = await Promise.all([
        getVehicles(filters),
        getLocations(),
      ]);
      setVehicles(vehiclesData);
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

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Our Cars</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pick-up Location
            </label>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} - {loc.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pick-up Date
            </label>
            <input
              type="date"
              value={filters.available_from}
              onChange={(e) => handleFilterChange('available_from', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drop-off Date
            </label>
            <input
              type="date"
              value={filters.available_to}
              onChange={(e) => handleFilterChange('available_to', e.target.value)}
              min={filters.available_from || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No vehicles found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
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

