'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Car } from 'lucide-react';
import VehicleCard from './VehicleCard';
import EmptyState from '@/components/admin/EmptyState';

interface VehiclePanelProps {
  vehicles: any[];
  subunits: any[];
  availabilityData: any;
  selectedVehicle: string | null;
  searchQuery?: string;
  onVehicleSelect: (vehicleId: string | null) => void;
  onSubunitStatusChange?: (subunitId: string, status: string) => void;
  onStatusClick?: (status: string) => void;
  loadingSubunits?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function VehiclePanel({
  vehicles,
  subunits,
  availabilityData,
  selectedVehicle,
  searchQuery = '',
  onVehicleSelect,
  onSubunitStatusChange,
  onStatusClick,
  loadingSubunits = false,
  collapsed = false,
  onToggleCollapse,
}: VehiclePanelProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Merge availability data with vehicles
  const vehiclesWithAvailability = vehicles.map((vehicle) => {
    const availabilityInfo = availabilityData?.vehicles?.find(
      (v: any) => v.vehicle_id === vehicle.id
    );
    return {
      ...vehicle,
      total_subunits: availabilityInfo?.total_subunits || vehicle.total_subunits || 0,
      available_subunits: availabilityInfo?.available_subunits || 0,
      reserved_subunits: availabilityInfo?.reserved_subunits || 0,
      out_on_rent_subunits: availabilityInfo?.out_on_rent_subunits || 0,
      returned_subunits: availabilityInfo?.returned_subunits || 0,
      maintenance_subunits: availabilityInfo?.maintenance_subunits || 0,
    };
  });

  // Filter vehicles by search
  const filteredVehicles = vehiclesWithAvailability.filter((vehicle) => {
    if (!localSearch) return true;
    const search = localSearch.toLowerCase();
    return (
      vehicle.make?.toLowerCase().includes(search) ||
      vehicle.model?.toLowerCase().includes(search) ||
      vehicle.year?.toString().includes(search)
    );
  });

  if (collapsed) {
    return (
      <div className="hidden lg:flex w-16 bg-white border-r border-gray-200 flex-col items-center py-4 shadow-sm">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all mb-4"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        <Car className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full lg:w-72 bg-white border-r border-gray-200 flex flex-col min-h-0 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Vehicles</h2>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search vehicles..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {filteredVehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles found"
            description={
              localSearch
                ? 'Try adjusting your search'
                : 'No vehicles available'
            }
          />
        ) : (
          filteredVehicles.map((vehicle) => {
            // Subunits are already filtered by selectedVehicle in the parent
            const vehicleSubunits = selectedVehicle === vehicle.id ? subunits : [];
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                subunits={vehicleSubunits}
                isSelected={selectedVehicle === vehicle.id}
                onClick={() =>
                  onVehicleSelect(
                    selectedVehicle === vehicle.id ? null : vehicle.id
                  )
                }
                onSubunitStatusChange={onSubunitStatusChange}
                loadingSubunits={loadingSubunits}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
