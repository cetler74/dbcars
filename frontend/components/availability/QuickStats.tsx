'use client';

import { CheckCircle2, Clock, Car, Wrench, Ban } from 'lucide-react';

interface QuickStatsProps {
  stats: {
    available?: number;
    reserved?: number;
    out_on_rent?: number;
    returned?: number;
    maintenance?: number;
    blocked?: number;
  };
  onStatusClick?: (status: string) => void;
}

export default function QuickStats({ stats, onStatusClick }: QuickStatsProps) {
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
    },
  ];

  return (
    <div className="space-y-2 p-3">
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
        Quick Stats
      </h3>
      <div className="space-y-2">
        {statItems.map((item) => {
          const Icon = item.icon;
          const Component = onStatusClick ? 'button' : 'div';
          return (
            <Component
              key={item.key}
              onClick={() => onStatusClick?.(item.key)}
              className={`
                w-full p-2.5 rounded-lg border transition-all
                ${item.bg} ${item.border} ${item.text}
                ${onStatusClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {item.count}
                </span>
              </div>
            </Component>
          );
        })}
      </div>
    </div>
  );
}
