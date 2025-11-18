import pool from '../config/database';

// Shared constant for active booking statuses that should block availability
export const ACTIVE_BOOKING_STATUSES = ['pending', 'waiting_payment', 'confirmed', 'active'];

export async function checkAvailability(
  vehicleId: string,
  pickupDate: Date,
  dropoffDate: Date
): Promise<{ available: boolean; availableSubunits: any[]; blockedDates?: any[] }> {
  // Normalize dates to start of day (UTC) to avoid timezone issues
  const normalizedPickupDate = new Date(pickupDate);
  normalizedPickupDate.setUTCHours(0, 0, 0, 0);
  
  const normalizedDropoffDate = new Date(dropoffDate);
  normalizedDropoffDate.setUTCHours(23, 59, 59, 999); // End of day for dropoff
  
  console.log('Checking availability:', {
    vehicleId,
    pickupDate: pickupDate.toISOString(),
    dropoffDate: dropoffDate.toISOString(),
    normalizedPickup: normalizedPickupDate.toISOString(),
    normalizedDropoff: normalizedDropoffDate.toISOString(),
  });

  // Get all subunits for this vehicle (check all statuses, filter booked ones later)
  const subunitsResult = await pool.query(
    `SELECT vs.*, l.name as location_name, l.city
     FROM vehicle_subunits vs
     LEFT JOIN locations l ON vs.current_location_id = l.id
     WHERE vs.vehicle_id = $1`,
    [vehicleId]
  );

  if (subunitsResult.rows.length === 0) {
    console.log('No subunits found for vehicle:', vehicleId);
    return { available: false, availableSubunits: [] };
  }

  console.log(`Found ${subunitsResult.rows.length} subunits for vehicle ${vehicleId}`);

  // Check for blocked/maintenance dates in the availability_notes table
  // Use date-only comparison for blocked dates
  const blockedDatesResult = await pool.query(
    `SELECT DISTINCT note_date, note_type, note
     FROM availability_notes
     WHERE (vehicle_id = $1 OR vehicle_subunit_id IN (
       SELECT id FROM vehicle_subunits WHERE vehicle_id = $1
     ))
     AND note_type IN ('maintenance', 'blocked')
     AND DATE(note_date) >= DATE($2)
     AND DATE(note_date) <= DATE($3)`,
    [vehicleId, normalizedPickupDate, normalizedDropoffDate]
  );

  if (blockedDatesResult.rows.length > 0) {
    console.log('Blocked dates found:', blockedDatesResult.rows);
    return {
      available: false,
      availableSubunits: [],
      blockedDates: blockedDatesResult.rows,
    };
  }

  // Check which subunits are booked in this date range
  // Use standardized active booking statuses to prevent double bookings
  // Overlap logic: two date ranges overlap if:
  // existing.pickup_date <= new.dropoff_date AND existing.dropoff_date >= new.pickup_date
  // This allows same-day handoffs (return and pickup on same day)
  const bookingsResult = await pool.query(
    `SELECT DISTINCT vehicle_subunit_id, pickup_date, dropoff_date, status
     FROM bookings
     WHERE vehicle_subunit_id IN (
       SELECT id FROM vehicle_subunits WHERE vehicle_id = $1
     )
     AND status = ANY($4::text[])
     AND (pickup_date <= $3 AND dropoff_date >= $2)`,
    [vehicleId, normalizedPickupDate, normalizedDropoffDate, ACTIVE_BOOKING_STATUSES]
  );

  console.log(`Found ${bookingsResult.rows.length} overlapping bookings:`, 
    bookingsResult.rows.map(b => ({
      subunit_id: b.vehicle_subunit_id,
      pickup: b.pickup_date,
      dropoff: b.dropoff_date,
      status: b.status
    }))
  );

  const bookedSubunitIds = new Set(
    bookingsResult.rows.map((b) => b.vehicle_subunit_id)
  );

  // Filter available subunits - exclude booked ones and maintenance ones
  // Consider subunits with 'reserved' status if they're not actually booked
  const availableSubunits = subunitsResult.rows.filter((subunit) => {
    // Exclude if booked
    if (bookedSubunitIds.has(subunit.id)) {
      console.log(`Subunit ${subunit.id} is booked`);
      return false;
    }
    // Exclude maintenance status
    if (subunit.status === 'maintenance') {
      console.log(`Subunit ${subunit.id} is in maintenance`);
      return false;
    }
    // Include available, reserved (if not booked), returned, and out_on_rent (if not booked)
    return true;
  });

  console.log(`Availability result: ${availableSubunits.length} available subunits out of ${subunitsResult.rows.length} total`);

  return {
    available: availableSubunits.length > 0,
    availableSubunits,
  };
}

