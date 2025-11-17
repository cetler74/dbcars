import pool from '../config/database';

// Shared constant for active booking statuses that should block availability
export const ACTIVE_BOOKING_STATUSES = ['pending', 'waiting_payment', 'confirmed', 'active'];

export async function checkAvailability(
  vehicleId: string,
  pickupDate: Date,
  dropoffDate: Date
): Promise<{ available: boolean; availableSubunits: any[]; blockedDates?: any[] }> {
  // Get all subunits for this vehicle (check all statuses, filter booked ones later)
  const subunitsResult = await pool.query(
    `SELECT vs.*, l.name as location_name, l.city
     FROM vehicle_subunits vs
     LEFT JOIN locations l ON vs.current_location_id = l.id
     WHERE vs.vehicle_id = $1`,
    [vehicleId]
  );

  if (subunitsResult.rows.length === 0) {
    return { available: false, availableSubunits: [] };
  }

  // Check for blocked/maintenance dates in the availability_notes table
  const blockedDatesResult = await pool.query(
    `SELECT DISTINCT note_date, note_type, note
     FROM availability_notes
     WHERE (vehicle_id = $1 OR vehicle_subunit_id IN (
       SELECT id FROM vehicle_subunits WHERE vehicle_id = $1
     ))
     AND note_type IN ('maintenance', 'blocked')
     AND note_date >= $2
     AND note_date <= $3`,
    [vehicleId, pickupDate, dropoffDate]
  );

  if (blockedDatesResult.rows.length > 0) {
    return {
      available: false,
      availableSubunits: [],
      blockedDates: blockedDatesResult.rows,
    };
  }

  // Check which subunits are booked in this date range
  // Use standardized active booking statuses to prevent double bookings
  const bookingsResult = await pool.query(
    `SELECT DISTINCT vehicle_subunit_id
     FROM bookings
     WHERE vehicle_subunit_id IN (
       SELECT id FROM vehicle_subunits WHERE vehicle_id = $1
     )
     AND status = ANY($4::text[])
     AND (pickup_date <= $3 AND dropoff_date >= $2)`,
    [vehicleId, pickupDate, dropoffDate, ACTIVE_BOOKING_STATUSES]
  );

  const bookedSubunitIds = new Set(
    bookingsResult.rows.map((b) => b.vehicle_subunit_id)
  );

  // Filter available subunits - exclude booked ones and maintenance ones
  // Consider subunits with 'reserved' status if they're not actually booked
  const availableSubunits = subunitsResult.rows.filter((subunit) => {
    // Exclude if booked
    if (bookedSubunitIds.has(subunit.id)) {
      return false;
    }
    // Exclude maintenance status
    if (subunit.status === 'maintenance') {
      return false;
    }
    // Include available, reserved (if not booked), returned, and out_on_rent (if not booked)
    return true;
  });

  return {
    available: availableSubunits.length > 0,
    availableSubunits,
  };
}

