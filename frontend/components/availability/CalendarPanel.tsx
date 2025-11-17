'use client';

import CompactCalendarGrid from './CompactCalendarGrid';
import CalendarToolbar from './CalendarToolbar';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';
import { Calendar } from 'lucide-react';

interface CalendarPanelProps {
  month: number;
  year: number;
  availabilityData: any;
  selectedDates?: Date[];
  loading?: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onDayClick?: (date: Date, e: React.MouseEvent) => void;
  onQuickAdd?: (date: Date) => void;
  onEditNote?: (note: any) => void;
  onDeleteNote?: (noteId: string) => void;
}

export default function CalendarPanel({
  month,
  year,
  availabilityData,
  selectedDates = [],
  loading = false,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDayClick,
  onQuickAdd,
  onEditNote,
  onDeleteNote,
}: CalendarPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <CalendarToolbar
        month={month}
        year={year}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 scrollbar-hide-y">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-white">
            <LoadingSpinner size="md" text="Loading calendar..." />
          </div>
        ) : availabilityData ? (
          <CompactCalendarGrid
            month={month}
            year={year}
            availabilityData={availabilityData}
            selectedDates={selectedDates}
            onDayClick={onDayClick}
            onQuickAdd={onQuickAdd}
            onEditNote={onEditNote}
            onDeleteNote={onDeleteNote}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-white">
            <EmptyState
              icon={Calendar}
              title="No calendar data"
              description="Select a vehicle or adjust filters to view availability"
            />
          </div>
        )}
      </div>
    </div>
  );
}
