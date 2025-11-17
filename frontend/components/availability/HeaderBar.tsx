'use client';

import { Calendar, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderBarProps {
  month: number;
  year: number;
  viewMode?: 'day' | 'week' | 'month' | 'quarter';
  onViewModeChange?: (mode: 'day' | 'week' | 'month' | 'quarter') => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onToday: () => void;
  onNextMonth: () => void;
  onPrevMonth: () => void;
  onSearchChange?: (query: string) => void;
  onExport?: () => void;
  searchQuery?: string;
}

export default function HeaderBar({
  month,
  year,
  viewMode = 'month',
  onViewModeChange,
  onMonthChange,
  onYearChange,
  onToday,
  onNextMonth,
  onPrevMonth,
  onSearchChange,
  onExport,
  searchQuery = '',
}: HeaderBarProps) {
  const [searchValue, setSearchValue] = useState(searchQuery);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!onSearchChange) return;
    const timeoutId = setTimeout(() => {
      onSearchChange(searchValue);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchValue, onSearchChange]);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left side: Date Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToday}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevMonth}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              title="Previous month (P)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onNextMonth}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              title="Next month (N)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={month}
              onChange={(e) => onMonthChange(parseInt(e.target.value))}
              className="text-base font-bold text-gray-900 bg-white border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer transition-all"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(year, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value) || year)}
              className="w-24 text-base font-bold text-gray-900 bg-white border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Center: View Mode Tabs */}
        {onViewModeChange && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(['day', 'week', 'month', 'quarter'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`
                  px-4 py-1.5 text-xs font-semibold rounded-lg transition-all
                  ${
                    viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Right side: Search and Actions */}
        <div className="flex items-center gap-3">
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search vehicles, customers..."
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64 transition-all"
              />
            </div>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
              title="Export (E)"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
