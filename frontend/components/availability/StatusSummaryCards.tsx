'use client';

import { CheckCircle2, Clock, Car, Wrench, Ban } from 'lucide-react';

interface StatusSummaryCardsProps {
  stats: {
    available?: number;
    reserved?: number;
    out_on_rent?: number;
    returned?: number;
    maintenance?: number;
    blocked?: number;
    total?: number;
  };
  onStatusClick?: (status: string) => void;
}

export default function StatusSummaryCards({
  stats,
  onStatusClick,
}: StatusSummaryCardsProps) {
  const total = stats.total || 0;

  const statItems = [
    {
      key: 'available',
      label: 'Available',
      count: stats.available || 0,
      icon: CheckCircle2,
      color: 'emerald',
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      progress: 'from-emerald-500 to-green-500',
    },
    {
      key: 'reserved',
      label: 'Reserved',
      count: stats.reserved || 0,
      icon: Clock,
      color: 'amber',
      bg: 'from-amber-50 to-yellow-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      progress: 'from-amber-500 to-yellow-500',
    },
    {
      key: 'out_on_rent',
      label: 'Out/On Rent',
      count: stats.out_on_rent || 0,
      icon: Car,
      color: 'blue',
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      progress: 'from-blue-500 to-cyan-500',
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      count: stats.maintenance || 0,
      icon: Wrench,
      color: 'orange',
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      progress: 'from-orange-500 to-amber-500',
    },
    {
      key: 'blocked',
      label: 'Blocked',
      count: stats.blocked || 0,
      icon: Ban,
      color: 'red',
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-200',
      text: 'text-red-700',
      progress: 'from-red-500 to-rose-500',
    },
  ];

  // Filter out items with 0 count and no total, or show all if total > 0
  const visibleItems = total > 0 
    ? statItems.filter(item => item.count > 0)
    : statItems;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {visibleItems.length > 0 ? (
        visibleItems.map((item) => {
          const Icon = item.icon;
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          const Component = onStatusClick ? 'button' : 'div';

          return (
            <Component
              key={item.key}
              onClick={() => onStatusClick?.(item.key)}
              className={`
                p-4 rounded-2xl border-2 transition-all shadow-sm
                ${item.bg} ${item.border} ${item.text}
                ${onStatusClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}
              `}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5" />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              <div className="text-3xl font-bold mb-2">{item.count}</div>
              {total > 0 && (
                <>
                  <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.progress} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mt-2">
                    {percentage.toFixed(1)}% of total
                  </div>
                </>
              )}
            </Component>
          );
        })
      ) : (
        <div className="col-span-2 md:col-span-5 text-center text-gray-500 py-4">
          No status data available
        </div>
      )}
    </div>
  );
}
