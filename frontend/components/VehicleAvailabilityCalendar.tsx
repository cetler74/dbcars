import React from 'react';

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
      // Treat the whole rental period as returned so the vehicle never shows as available
      // during a completed booking's date range.
      return 'returned';
    default:
      return null;
  }
}

function getDayInfo(availabilityData: AvailabilityData | null, date: Date): DayInfo {
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
    status = DAY_STATUS_PRIORITY.find((s) => statusCandidates.includes(s)) || 'available';
  }

  // If there is at least one booking on this day, never show it as plain available.
  // Default to out/on rent blue when our earlier inference still resulted in "available".
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

  return {
    date,
    status,
    startTimes,
    endTimes,
    notes,
    bookings,
  };
}

function getStatusColor(status: DayStatus) {
  switch (status) {
    case 'available':
      return 'bg-green-100 border-green-300';
    case 'reserved':
      return 'bg-yellow-100 border-yellow-300';
    case 'out_on_rent':
      return 'bg-blue-100 border-blue-300';
    case 'returned':
      return 'bg-gray-100 border-gray-300';
    case 'maintenance':
      return 'bg-orange-100 border-orange-300';
    case 'blocked':
      return 'bg-red-100 border-red-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
}

function getNoteTypeColor(type: string) {
  switch (type) {
    case 'maintenance':
      return 'bg-orange-100 text-orange-800';
    case 'blocked':
      return 'bg-red-100 text-red-800';
    case 'special':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
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
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }

  return days;
}

interface VehicleAvailabilityCalendarProps {
  month: number;
  year: number;
  availabilityData: AvailabilityData | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function VehicleAvailabilityCalendar({
  month,
  year,
  availabilityData,
  onPrevMonth,
  onNextMonth,
}: VehicleAvailabilityCalendarProps) {
  const todayStr = toDateOnlyString(new Date());
  const days = getDaysForMonthGrid(year, month);

  const isInCurrentMonth = (date: Date) =>
    date.getMonth() === month - 1 && date.getFullYear() === year;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Calendar View</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Previous
          </button>
          <div className="text-sm font-medium">
            {new Date(year, month - 1).toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-700 py-2">
            {day}
          </div>
        ))}

        {days.map((date, index) => {
          const dayInfo = getDayInfo(availabilityData, date);
          const dateStr = toDateOnlyString(date);
          const isToday = dateStr === todayStr;
          const inCurrentMonth = isInCurrentMonth(date);

          const borderHighlight = isToday ? 'ring-2 ring-gray-900' : '';
          const opacityClass = inCurrentMonth ? '' : 'opacity-40';
          const statusClasses = getStatusColor(dayInfo.status);

          const showStart =
            inCurrentMonth && dayInfo.startTimes.length > 0 && dayInfo.status !== 'available';
          const showEnd =
            inCurrentMonth && dayInfo.endTimes.length > 0 && dayInfo.status !== 'available';

          const startLabel =
            dayInfo.startTimes.length === 1
              ? dayInfo.startTimes[0]
              : `${dayInfo.startTimes.length} starts`;
          const endLabel =
            dayInfo.endTimes.length === 1
              ? dayInfo.endTimes[0]
              : `${dayInfo.endTimes.length} returns`;

          const statusLabelMap: Record<DayStatus, string> = {
            // For available days we rely only on the green background color,
            // so we don't show a text label.
            available: '',
            reserved: 'Reserved',
            out_on_rent: 'Out/On Rent',
            returned: 'Returned',
            maintenance: 'Maintenance',
            blocked: 'Blocked',
          };

          return (
            <div
              key={index}
              className={`min-h-24 p-2 border-2 rounded text-xs flex flex-col gap-1 ${statusClasses} ${borderHighlight} ${opacityClass}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{date.getDate()}</span>
                {inCurrentMonth && statusLabelMap[dayInfo.status] && (
                  <span className="px-2 py-0.5 rounded-full bg-white/70 text-[10px] font-semibold text-gray-800">
                    {statusLabelMap[dayInfo.status]}
                  </span>
                )}
              </div>

              {showStart && (
                <div className="text-[10px] text-gray-800">
                  <span className="font-semibold">Start:</span> {startLabel}
                </div>
              )}

              {showEnd && (
                <div className="text-[10px] text-gray-800">
                  <span className="font-semibold">End:</span> {endLabel}
                </div>
              )}

              {dayInfo.notes.length > 0 && (
                <div className="space-y-1 mt-1">
                  {dayInfo.notes.map((note: any) => (
                    <div
                      key={note.id}
                      className={`text-[10px] px-1 py-0.5 rounded ${getNoteTypeColor(note.note_type)}`}
                      title={note.note}
                    >
                      {note.note_type}
                    </div>
                  ))}
                </div>
              )}

              {inCurrentMonth && dayInfo.bookings.length > 0 && (
                <div className="mt-auto text-[10px] text-blue-700">
                  {dayInfo.bookings.length} booking
                  {dayInfo.bookings.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
          <span>Out/On Rent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
          <span>Returned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
          <span>Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
          <span>Blocked</span>
        </div>
      </div>
    </div>
  );
}

export default VehicleAvailabilityCalendar;


