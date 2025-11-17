'use client';

import { CheckCircle2, Clock, XCircle, PlayCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<string, { 
  bg: string; 
  text: string; 
  border: string;
  icon: React.ReactNode;
  glow: string;
}> = {
  completed: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    glow: 'shadow-emerald-200/50'
  },
  confirmed: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    glow: 'shadow-emerald-200/50'
  },
  active: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <PlayCircle className="w-3.5 h-3.5" />,
    glow: 'shadow-blue-200/50'
  },
  pending: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: <Clock className="w-3.5 h-3.5" />,
    glow: 'shadow-amber-200/50'
  },
  cancelled: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: <XCircle className="w-3.5 h-3.5" />,
    glow: 'shadow-red-200/50'
  },
  default: {
    bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    glow: 'shadow-gray-200/50'
  }
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm'
};

export default function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.default;
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`
        ${config.bg}
        ${config.text}
        ${config.border}
        ${sizeClass}
        inline-flex items-center gap-1.5
        font-semibold rounded-full border
        shadow-sm ${config.glow}
        transition-all duration-200
        hover:shadow-md hover:scale-105
        capitalize
      `}
    >
      {showIcon && <span className="flex-shrink-0">{config.icon}</span>}
      <span>{status}</span>
    </span>
  );
}

