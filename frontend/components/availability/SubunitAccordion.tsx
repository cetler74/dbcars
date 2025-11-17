'use client';

import { FileText, MapPin, Gauge } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';

interface SubunitAccordionProps {
  subunits: any[];
  onStatusChange?: (subunitId: string, status: string) => void;
  loading?: boolean;
}

export default function SubunitAccordion({
  subunits,
  onStatusChange,
  loading = false,
}: SubunitAccordionProps) {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      available: 'active',
      reserved: 'pending',
      out_on_rent: 'active',
      returned: 'completed',
      maintenance: 'pending',
    };
    return statusMap[status] || 'default';
  };

  if (loading) {
    return (
      <div className="text-xs text-gray-500 text-center py-2">Loading...</div>
    );
  }

  if (subunits.length === 0) {
    return (
      <div className="text-xs text-gray-500 text-center py-2">
        No units found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subunits.map((subunit) => (
        <div
          key={subunit.id}
          className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs"
        >
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium text-gray-900">
                {subunit.license_plate}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600">
                {subunit.mileage?.toLocaleString() || 0} km
              </span>
            </div>
          </div>
          {subunit.location_name && (
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600 truncate">
                {subunit.location_name}
                {subunit.location_city && `, ${subunit.location_city}`}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={getStatusBadge(subunit.status)} size="sm" />
            {onStatusChange && (
              <select
                value={subunit.status}
                onChange={(e) => {
                  if (
                    confirm(
                      `Change status to ${e.target.value}?`
                    )
                  ) {
                    onStatusChange?.(subunit.id, e.target.value);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="out_on_rent">Out/On Rent</option>
                <option value="returned">Returned</option>
                <option value="maintenance">Maintenance</option>
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
