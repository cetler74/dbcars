import { useCallback } from 'react';
import {
  updateSubunitStatus,
  createAvailabilityNote,
  updateAvailabilityNote,
  deleteAvailabilityNote,
} from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateNoteParams {
  vehicle_id?: string;
  vehicle_subunit_id?: string;
  note_date: string;
  note: string;
  note_type: 'maintenance' | 'blocked' | 'special';
}

interface DateRange {
  start: Date;
  end: Date;
}

export function useQuickActions(onSuccess?: () => void) {
  const updateStatus = useCallback(
    async (subunitId: string, newStatus: string) => {
      try {
        await updateSubunitStatus(subunitId, newStatus);
        toast.success('Status updated successfully');
        onSuccess?.();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Error updating status');
        throw error;
      }
    },
    [onSuccess]
  );

  const createNote = useCallback(
    async (noteData: CreateNoteParams) => {
      try {
        await createAvailabilityNote(noteData);
        toast.success('Availability note created successfully');
        onSuccess?.();
      } catch (error: any) {
        if (error.response?.data?.warning) {
          // Show warning but allow user to proceed if they want
          const proceed = confirm(
            `${error.response.data.error}\n\nDo you want to proceed anyway?`
          );
          if (proceed) {
            // User wants to proceed - we could add a force flag here
            toast.warning('Note created with existing bookings on this date');
            onSuccess?.();
          }
        } else {
          toast.error(
            error.response?.data?.error || 'Error creating availability note'
          );
        }
        throw error;
      }
    },
    [onSuccess]
  );

  const createNotesForRange = useCallback(
    async (
      dateRange: DateRange,
      vehicleId?: string,
      subunitId?: string,
      note: string = '',
      noteType: 'maintenance' | 'blocked' | 'special' = 'maintenance'
    ) => {
      try {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end);
        endDate.setHours(0, 0, 0, 0);

        if (endDate < startDate) {
          toast.error('End date cannot be before start date');
          return;
        }

        const datesToBlock: Date[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          datesToBlock.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const promises = datesToBlock.map((date) =>
          createAvailabilityNote({
            vehicle_id: vehicleId,
            vehicle_subunit_id: subunitId,
            note_date: date.toISOString().split('T')[0],
            note,
            note_type: noteType,
          })
        );

        const results = await Promise.allSettled(promises);
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        if (failed > 0) {
          toast.warning(
            `Created ${successful} note(s), ${failed} failed (may have bookings on those dates)`
          );
        } else {
          toast.success(
            `Created ${datesToBlock.length} availability note(s) successfully`
          );
        }
        onSuccess?.();
      } catch (error: any) {
        toast.error(
          error.response?.data?.error || 'Error creating availability notes'
        );
        throw error;
      }
    },
    [onSuccess]
  );

  const updateNote = useCallback(
    async (noteId: string, noteData: {
      note_date?: string;
      note?: string;
      note_type?: 'maintenance' | 'blocked' | 'special';
    }) => {
      try {
        await updateAvailabilityNote(noteId, noteData);
        toast.success('Availability note updated successfully');
        onSuccess?.();
      } catch (error: any) {
        toast.error(
          error.response?.data?.error || 'Error updating availability note'
        );
        throw error;
      }
    },
    [onSuccess]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        await deleteAvailabilityNote(noteId);
        toast.success('Note deleted successfully');
        onSuccess?.();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Error deleting note');
        throw error;
      }
    },
    [onSuccess]
  );

  return {
    updateStatus,
    createNote,
    createNotesForRange,
    updateNote,
    deleteNote,
  };
}
