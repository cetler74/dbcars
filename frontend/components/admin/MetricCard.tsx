'use client';

import Link from 'next/link';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  href?: string;
  onClick?: () => void;
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  onClick,
  trend,
  loading = false
}: MetricCardProps) {
  const content = (
    <div 
      className={`group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 ${iconBg} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          {href && (
            <Link 
              href={href}
              className="text-xs font-semibold text-gray-500 hover:text-orange-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              View all →
            </Link>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
          {loading ? (
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>

        {trend && trend.value !== 0 && (
          <div className="mt-4 flex items-center gap-2">
            {trend.value > 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : trend.value < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : (
              <Minus className="w-4 h-4 text-gray-400" />
            )}
            <span className={`text-xs font-semibold ${
              trend.value > 0 ? 'text-emerald-600' : 
              trend.value < 0 ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {Math.abs(trend.value)}% {trend.label}
            </span>
          </div>
        )}
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );

  if (href && !onClick) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

