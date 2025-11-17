'use client';

import CalendarDayCell from './CalendarDayCell';
import { useMemo } from 'react';

type AvailabilityData = {
  bookings?: any[];
  availability_notes?: any[];
};

type DayStatus =
  | 'available'
  | 'reserved'
  | 'out_on_rent'
  | 'returned'
  | 'maintenance'
  | 'blocked';

type DayInfo = {
  date: Date;
  status: DayStatus;
  startTimes: string[];
  endTimes: string[];
  notes: any[];
  bookings: any[];
  hasConflict?: boolean;
};

const DAY_STATUS_PRIORITY: DayStatus[] = [
  'maintenance',
  'out_on_rent',
  'reserved',
  'returned',
  'blocked',
  'available',
];

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toDateOnlyString(date: Date) {
  return date.toISOString().split('T')[0];
}

function getDayBookings(availabilityData: AvailabilityData | null, date: Date) {
  if (!availabilityData?.bookings) return [];
  const dateStr = toDateOnlyString(date);
  return availabilityData.bookings.filter((booking: any) => {
    const pickup = toDateOnlyString(new Date(booking.pickup_date));
    const dropoff = toDateOnlyString(new Date(booking.dropoff_date));
    return dateStr >= pickup && dateStr <= dropoff;
  });
}

function getDayNotes(availabilityData: AvailabilityData | null, date: Date) {
  if (!availabilityData?.availability_notes) return [];
  const dateStr = toDateOnlyString(date);
  return availabilityData.availability_notes.filter((note: any) => {
    const noteDate = toDateOnlyString(new Date(note.note_date));
    return noteDate === dateStr;
  });
}

function inferStatusFromBooking(booking: any, date: Date): DayStatus | null {
  const bookingStatus = booking.booking_status || booking.status;
  if (bookingStatus === 'cancelled') return null;

  const pickup = new Date(booking.pickup_date);
  const dropoff = new Date(booking.dropoff_date);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  const pickupOnly = new Date(pickup);
  pickupOnly.setHours(0, 0, 0, 0);
  const dropoffOnly = new Date(dropoff);
  dropoffOnly.setHours(0, 0, 0, 0);

  switch (bookingStatus) {
    case 'waiting_payment':
    case 'pending':
      return 'reserved';
    case 'confirmed':
    case 'active':
      if (dateOnly.getTime() < pickupOnly.getTime()) {
        return 'reserved';
      }
      if (dateOnly.getTime() > dropoffOnly.getTime()) {
        return 'returned';
      }
      if (dateOnly.getTime() === dropoffOnly.getTime()) {
        return 'returned';
      }
      return 'out_on_rent';
    case 'completed':
      return 'returned';
    default:
      return null;
  }
}

function detectConflicts(bookings: any[], date: Date): boolean {
  // Enhanced conflict detection: check for actual date range overlaps
  const dateStr = toDateOnlyString(date);
  const dayBookings = bookings.filter((booking: any) => {
    const pickup = toDateOnlyString(new Date(booking.pickup_date));
    const dropoff = toDateOnlyString(new Date(booking.dropoff_date));
    return dateStr >= pickup && dateStr <= dropoff;
  });

  if (dayBookings.length <= 1) return false;

  // Group bookings by vehicle_subunit_id
  const bookingsBySubunit = new Map<string, any[]>();
  dayBookings.forEach((booking: any) => {
    const subunitId = booking.vehicle_subunit_id;
    if (subunitId) {
      if (!bookingsBySubunit.has(subunitId)) {
        bookingsBySubunit.set(subunitId, []);
      }
      bookingsBySubunit.get(subunitId)!.push(booking);
    }
  });

  // Check for overlapping date ranges within the same subunit
  for (const [subunitId, subunitBookings] of bookingsBySubunit.entries()) {
    if (subunitBookings.length > 1) {
      // Sort by pickup date
      subunitBookings.sort((a, b) => 
        new Date(a.pickup_date).getTime() - new Date(b.pickup_date).getTime()
      );

      // Check for overlaps
      for (let i = 0; i < subunitBookings.length - 1; i++) {
        const current = subunitBookings[i];
        const next = subunitBookings[i + 1];
        const currentDropoff = new Date(current.dropoff_date);
        const nextPickup = new Date(next.pickup_date);

        // If current dropoff is after next pickup, there's an overlap
        if (currentDropoff >= nextPickup) {
          return true;
        }
      }
    }
  }

  return false;
}

function getDayInfo(
  availabilityData: AvailabilityData | null,
  date: Date
): DayInfo {
  const bookings = getDayBookings(availabilityData, date);
  const notes = getDayNotes(availabilityData, date);

  const statusCandidates: DayStatus[] = [];

  // Notes override bookings
  notes.forEach((note: any) => {
    if (note.note_type === 'maintenance') {
      statusCandidates.push('maintenance');
    } else if (note.note_type === 'blocked') {
      statusCandidates.push('blocked');
    }
  });

  bookings.forEach((booking: any) => {
    const inferred = inferStatusFromBooking(booking, date);
    if (inferred) {
      statusCandidates.push(inferred);
    }
  });

  let status: DayStatus = 'available';
  if (statusCandidates.length > 0) {
    status =
      DAY_STATUS_PRIORITY.find((s) => statusCandidates.includes(s)) ||
      'available';
  }

  // If there is at least one booking on this day, never show it as plain available.
  if (bookings.length > 0 && status === 'available') {
    status = 'out_on_rent';
  }

  const startTimes: string[] = [];
  const endTimes: string[] = [];
  const dateStr = toDateOnlyString(date);

  bookings.forEach((booking: any) => {
    const pickup = new Date(booking.pickup_date);
    const dropoff = new Date(booking.dropoff_date);
    const pickupStr = toDateOnlyString(pickup);
    const dropoffStr = toDateOnlyString(dropoff);
    if (pickupStr === dateStr) {
      startTimes.push(formatTime(pickup));
    }
    if (dropoffStr === dateStr) {
      endTimes.push(formatTime(dropoff));
    }
  });

  const hasConflict = detectConflicts(bookings, date);

  return {
    date,
    status,
    startTimes,
    endTimes,
    notes,
    bookings,
    hasConflict,
  };
}

function getDaysForMonthGrid(year: number, month: number) {
  const days: Date[] = [];
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstOfMonth.getDay();

  // Fill leading empty days
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(new Date(year, month - 1, 1 - (firstDayOfWeek - i)));
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month - 1, d));
  }

  // Fill trailing to complete weeks
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(
      new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
    );
  }

  return days;
}

interface CompactCalendarGridProps {
  month: number;
  year: number;
  availabilityData: AvailabilityData | null;
  onDayClick?: (date: Date, e: React.MouseEvent) => void;
  onQuickAdd?: (date: Date) => void;
  onEditNote?: (note: any) => void;
  onDeleteNote?: (noteId: string) => void;
  selectedDates?: Date[];
}

export default function CompactCalendarGrid({
  month,
  year,
  availabilityData,
  onDayClick,
  onQuickAdd,
  onEditNote,
  onDeleteNote,
  selectedDates = [],
}: CompactCalendarGridProps) {
  const todayStr = toDateOnlyString(new Date());
  const days = useMemo(() => getDaysForMonthGrid(year, month), [year, month]);

  const isInCurrentMonth = (date: Date) =>
    date.getMonth() === month - 1 && date.getFullYear() === year;

  const isDateSelected = (date: Date) => {
    if (selectedDates.length === 0) return false;
    const dateStr = toDateOnlyString(date);
    return selectedDates.some((d) => toDateOnlyString(d) === dateStr);
  };

  return (
    <div className="bg-white p-6 pb-8">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-bold text-gray-700 py-3 bg-gray-50 rounded-xl"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const dayInfo = getDayInfo(availabilityData, date);
          const dateStr = toDateOnlyString(date);
          const isToday = dateStr === todayStr;
          const inCurrentMonth = isInCurrentMonth(date);
          const isSelected = isDateSelected(date);

          return (
            <CalendarDayCell
              key={index}
              dayInfo={{
                ...dayInfo,
                hasConflict: dayInfo.hasConflict || false,
              }}
              isToday={isToday}
              inCurrentMonth={inCurrentMonth}
              onCellClick={onDayClick}
              onQuickAdd={onQuickAdd}
              onEditNote={onEditNote}
              onDeleteNote={onDeleteNote}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
          <span className="font-medium text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
          <span className="font-medium text-gray-700">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
          <span className="font-medium text-gray-700">Out/On Rent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
          <span className="font-medium text-gray-700">Returned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
          <span className="font-medium text-gray-700">Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
          <span className="font-medium text-gray-700">Blocked</span>
        </div>
      </div>
    </div>
  );
}
