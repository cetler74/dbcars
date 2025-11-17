'use client';

import { X } from 'lucide-react';

interface QuickFiltersProps {
  filters: {
    vehicleId?: string;
    status?: string[];
    locationId?: string;
    searchQuery?: string;
  };
  vehicles: any[];
  locations?: any[];
  onFilterChange: (filters: {
    vehicleId?: string;
    status?: string[];
    locationId?: string;
    searchQuery?: string;
  }) => void;
}

const statusOptions = [
  { value: 'available', label: 'Available', color: 'bg-emerald-500' },
  { value: 'reserved', label: 'Reserved', color: 'bg-amber-500' },
  { value: 'out_on_rent', label: 'Out/On Rent', color: 'bg-blue-500' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-500' },
];

export default function QuickFilters({
  filters,
  vehicles,
  locations = [],
  onFilterChange,
}: QuickFiltersProps) {
  const activeFilterCount =
    (filters.vehicleId ? 1 : 0) +
    (filters.status?.length || 0) +
    (filters.locationId ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  const handleStatusToggle = (status: string) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status];
    onFilterChange({ ...filters, status: newStatus.length > 0 ? newStatus : undefined });
  };

  const handleVehicleChange = (vehicleId: string) => {
    onFilterChange({
      ...filters,
      vehicleId: vehicleId || undefined,
    });
  };

  const handleLocationChange = (locationId: string) => {
    onFilterChange({
      ...filters,
      locationId: locationId || undefined,
    });
  };

  const handleSearchChange = (searchQuery: string) => {
    onFilterChange({
      ...filters,
      searchQuery: searchQuery || undefined,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      vehicleId: undefined,
      status: undefined,
      locationId: undefined,
      searchQuery: undefined,
    });
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Vehicle Filter */}
        <select
          value={filters.vehicleId || ''}
          onChange={(e) => handleVehicleChange(e.target.value)}
          className="text-sm px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white appearance-none font-medium"
        >
          <option value="">All Vehicles</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </option>
          ))}
        </select>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusToggle(status.value)}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md
                ${
                  filters.status?.includes(status.value)
                    ? `${status.color} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Location Filter */}
        {locations.length > 0 && (
          <select
            value={filters.locationId || ''}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="text-sm px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white appearance-none font-medium"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} - {location.city}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
