'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  loading = false
}: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {loading ? (
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      )}
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

