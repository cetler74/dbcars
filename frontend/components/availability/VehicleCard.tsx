'use client';

import { Car, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import SubunitAccordion from './SubunitAccordion';

interface VehicleCardProps {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    total_subunits?: number;
    available_subunits?: number;
    reserved_subunits?: number;
    out_on_rent_subunits?: number;
    returned_subunits?: number;
    maintenance_subunits?: number;
  };
  subunits?: any[];
  isSelected?: boolean;
  onClick?: () => void;
  onSubunitStatusChange?: (subunitId: string, status: string) => void;
  loadingSubunits?: boolean;
}

export default function VehicleCard({
  vehicle,
  subunits = [],
  isSelected = false,
  onClick,
  onSubunitStatusChange,
  loadingSubunits = false,
}: VehicleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusDots = () => {
    const dots: string[] = [];
    const total = vehicle.total_subunits || 0;
    
    // Available (green)
    for (let i = 0; i < (vehicle.available_subunits || 0); i++) {
      dots.push('bg-green-500');
    }
    // Reserved (yellow)
    for (let i = 0; i < (vehicle.reserved_subunits || 0); i++) {
      dots.push('bg-yellow-500');
    }
    // Out on rent (blue)
    for (let i = 0; i < (vehicle.out_on_rent_subunits || 0); i++) {
      dots.push('bg-blue-500');
    }
    // Returned (gray)
    for (let i = 0; i < (vehicle.returned_subunits || 0); i++) {
      dots.push('bg-gray-400');
    }
    // Maintenance (orange)
    for (let i = 0; i < (vehicle.maintenance_subunits || 0); i++) {
      dots.push('bg-orange-500');
    }
    // Empty slots
    while (dots.length < total) {
      dots.push('bg-gray-200');
    }

    return dots.slice(0, total);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click to expand
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`
        border rounded-lg transition-all cursor-pointer
        ${isSelected
          ? 'border-orange-500 bg-orange-50/50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={handleClick}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Car className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {vehicle.make} {vehicle.model}
              </h4>
              <span className="text-xs text-gray-500 flex-shrink-0">
                ({vehicle.year})
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-600">
                {vehicle.available_subunits || 0} / {vehicle.total_subunits || 0} available
              </span>
            </div>
            {/* Status dots */}
            <div className="flex items-center gap-1 flex-wrap">
              {getStatusDots().map((dotColor, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${dotColor}`}
                  title={`Unit ${index + 1}`}
                />
              ))}
            </div>
          </div>
          {subunits.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {isExpanded && subunits.length > 0 && (
        <div className="border-t border-gray-200 p-3 bg-gray-50/50">
          <SubunitAccordion
            subunits={subunits}
            onStatusChange={onSubunitStatusChange}
            loading={loadingSubunits}
          />
        </div>
      )}
    </div>
  );
}
