'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarToolbarProps {
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function CalendarToolbar({
  month,
  year,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrevMonth}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          title="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {new Date(year, month - 1).toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </h2>
        <button
          onClick={onNextMonth}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          title="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <button
        onClick={onToday}
        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
      >
        Today
      </button>
    </div>
  );
}
