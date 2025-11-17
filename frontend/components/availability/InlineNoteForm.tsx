'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, FileText, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface InlineNoteFormProps {
  isOpen: boolean;
  position?: { x: number; y: number };
  date?: Date;
  dateRange?: { start: Date; end: Date };
  vehicleId?: string;
  subunitId?: string;
  editingNote?: {
    id: string;
    note_date: string;
    note: string;
    note_type: 'maintenance' | 'blocked' | 'special';
  };
  onClose: () => void;
  onSave: (data: {
    date?: Date;
    dateRange?: { start: Date; end: Date };
    note: string;
    note_type: 'maintenance' | 'blocked' | 'special';
    vehicle_id?: string;
    vehicle_subunit_id?: string;
    note_id?: string;
  }) => void;
}

export default function InlineNoteForm({
  isOpen,
  position,
  date,
  dateRange: initialDateRange,
  vehicleId,
  subunitId,
  editingNote,
  onClose,
  onSave,
}: InlineNoteFormProps) {
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState<'maintenance' | 'blocked' | 'special'>('maintenance');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: date || initialDateRange?.start || null,
    end: initialDateRange?.end || date || null,
  });
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && editingNote) {
      // Edit mode - populate form with existing note data
      setNote(editingNote.note);
      setNoteType(editingNote.note_type);
      const noteDate = new Date(editingNote.note_date);
      setDateRange({ start: noteDate, end: noteDate });
    } else if (!isOpen) {
      // Reset form when closed
      setNote('');
      setNoteType('maintenance');
      if (date) {
        setDateRange({ start: date, end: date });
      } else if (initialDateRange) {
        setDateRange({ start: initialDateRange.start, end: initialDateRange.end });
      }
    }
  }, [isOpen, date, initialDateRange, editingNote]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      return;
    }

    if (!dateRange.start) {
      return;
    }

    // If we have both start and end dates (and they're different), use date range
    if (dateRange.end && dateRange.start.getTime() !== dateRange.end.getTime()) {
      onSave({
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
        note: note.trim(),
        note_type: noteType,
        vehicle_id: vehicleId,
        vehicle_subunit_id: subunitId,
        note_id: editingNote?.id,
      });
    } else {
      // Single date
      onSave({
        date: dateRange.start,
        note: note.trim(),
        note_type: noteType,
        vehicle_id: vehicleId,
        vehicle_subunit_id: subunitId,
        note_id: editingNote?.id,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={formRef}
      className={`
        fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[320px]
        ${position ? '' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}
      `}
      style={position ? { left: position.x, top: position.y } : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">
          {editingNote ? 'Edit Availability Note' : 'Add Availability Note'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Date Range
          </label>
          <div className="relative">
            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <DatePicker
              selected={dateRange.start}
              onChange={(dates: [Date | null, Date | null] | null) => {
                if (dates) {
                  const [start, end] = dates;
                  setDateRange({
                    start: start,
                    end: end || start,
                  });
                } else {
                  setDateRange({ start: null, end: null });
                }
              }}
              startDate={dateRange.start}
              endDate={dateRange.end}
              selectsRange
              minDate={editingNote ? undefined : new Date()}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              wrapperClassName="w-full"
              dateFormat="dd/MM/yyyy"
              placeholderText="Select date range"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Note Type
          </label>
          <div className="relative">
            <AlertCircle className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <select
              value={noteType}
              onChange={(e) =>
                setNoteType(e.target.value as 'maintenance' | 'blocked' | 'special')
              }
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
              required
            >
              <option value="maintenance">Maintenance</option>
              <option value="blocked">Blocked</option>
              <option value="special">Special</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Note
          </label>
          <div className="relative">
            <FileText className="absolute left-2 top-2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              rows={3}
              placeholder="Enter note..."
              required
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-semibold rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
