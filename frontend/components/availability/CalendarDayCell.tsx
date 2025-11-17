'use client';

import { Plus, AlertCircle } from 'lucide-react';
import { useState } from 'react';

type DayStatus =
  | 'available'
  | 'reserved'
  | 'out_on_rent'
  | 'returned'
  | 'maintenance'
  | 'blocked';

interface DayInfo {
  date: Date;
  status: DayStatus;
  startTimes: string[];
  endTimes: string[];
  notes: any[];
  bookings: any[];
  hasConflict?: boolean;
}

interface CalendarDayCellProps {
  dayInfo: DayInfo;
  isToday: boolean;
  inCurrentMonth: boolean;
  onCellClick?: (date: Date, e: React.MouseEvent) => void;
  onQuickAdd?: (date: Date) => void;
  onEditNote?: (note: any) => void;
  onDeleteNote?: (noteId: string) => void;
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

function getStatusLabel(status: DayStatus): string {
  switch (status) {
    case 'available':
      return '';
    case 'reserved':
      return 'Reserved';
    case 'out_on_rent':
      return 'Out/On Rent';
    case 'returned':
      return 'Returned';
    case 'maintenance':
      return 'Maintenance';
    case 'blocked':
      return 'Blocked';
    default:
      return '';
  }
}

export default function CalendarDayCell({
  dayInfo,
  isToday,
  inCurrentMonth,
  onCellClick,
  onQuickAdd,
  onEditNote,
  onDeleteNote,
}: CalendarDayCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showNoteTooltip, setShowNoteTooltip] = useState<string | null>(null);

  const statusClasses = getStatusColor(dayInfo.status);
  const borderHighlight = isToday ? 'ring-2 ring-gray-900' : '';
  const opacityClass = inCurrentMonth ? '' : 'opacity-40';
  const conflictClass = dayInfo.hasConflict ? 'ring-2 ring-red-500' : '';

  const statusLabel = getStatusLabel(dayInfo.status);

  return (
    <div
      className={`
        min-h-[80px] p-1.5 border-2 rounded text-xs flex flex-col gap-0.5 cursor-pointer
        transition-all hover:shadow-md
        ${statusClasses} ${borderHighlight} ${opacityClass} ${conflictClass}
      `}
      onClick={(e) => onCellClick?.(dayInfo.date, e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{dayInfo.date.getDate()}</span>
        {inCurrentMonth && statusLabel && (
          <span className="px-1.5 py-0.5 rounded-full bg-white/70 text-[9px] font-semibold text-gray-800 truncate max-w-[70px]">
            {statusLabel}
          </span>
        )}
      </div>

      {inCurrentMonth && dayInfo.bookings.length > 0 && (
        <div className="text-[9px] text-blue-700 font-semibold">
          {dayInfo.bookings.length} booking
          {dayInfo.bookings.length !== 1 ? 's' : ''}
        </div>
      )}

      {inCurrentMonth && dayInfo.notes.length > 0 && (
        <div className="space-y-0.5">
          {dayInfo.notes.slice(0, 2).map((note: any) => (
            <div
              key={note.id}
              className="relative"
              onMouseEnter={() => setShowNoteTooltip(note.id)}
              onMouseLeave={() => setShowNoteTooltip(null)}
            >
              <div
                className={`
                  text-[9px] px-1 py-0.5 rounded truncate cursor-pointer
                  hover:opacity-80 transition-opacity
                  ${note.note_type === 'maintenance'
                    ? 'bg-orange-200 text-orange-800'
                    : note.note_type === 'blocked'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-blue-200 text-blue-800'
                  }
                `}
                title={note.note}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditNote?.(note);
                }}
              >
                {note.note_type}
              </div>
              {showNoteTooltip === note.id && (
                <div className="absolute z-50 bottom-full left-0 mb-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg max-w-[200px]">
                  <div className="font-semibold mb-1">{note.note_type}</div>
                  <div className="text-gray-300">{note.note}</div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditNote?.(note);
                        setShowNoteTooltip(null);
                      }}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this note?')) {
                          onDeleteNote?.(note.id);
                        }
                        setShowNoteTooltip(null);
                      }}
                      className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {dayInfo.notes.length > 2 && (
            <div className="text-[9px] text-gray-600">
              +{dayInfo.notes.length - 2} more
            </div>
          )}
        </div>
      )}

      {inCurrentMonth && dayInfo.startTimes.length > 0 && (
        <div className="text-[9px] text-gray-700">
          <span className="font-semibold">Start:</span>{' '}
          {dayInfo.startTimes.length === 1
            ? dayInfo.startTimes[0]
            : `${dayInfo.startTimes.length} starts`}
        </div>
      )}

      {inCurrentMonth && dayInfo.endTimes.length > 0 && (
        <div className="text-[9px] text-gray-700">
          <span className="font-semibold">End:</span>{' '}
          {dayInfo.endTimes.length === 1
            ? dayInfo.endTimes[0]
            : `${dayInfo.endTimes.length} returns`}
        </div>
      )}

      {isHovered && inCurrentMonth && onQuickAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(dayInfo.date);
          }}
          className="mt-auto ml-auto p-1 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all"
          title="Quick add note"
        >
          <Plus className="w-3 h-3 text-gray-700" />
        </button>
      )}

      {dayInfo.hasConflict && inCurrentMonth && (
        <div className="mt-auto flex items-center gap-1 text-[9px] text-red-700 font-semibold">
          <AlertCircle className="w-3 h-3" />
          <span>Conflict</span>
        </div>
      )}
    </div>
  );
}
