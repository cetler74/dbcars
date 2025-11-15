import pool from '../config/database';

export async function checkAvailability(
  vehicleId: string,
  pickupDate: Date,
  dropoffDate: Date
): Promise<{ available: boolean; availableSubunits: any[] }> {
  // Get all subunits for this vehicle
  const subunitsResult = await pool.query(
    `SELECT vs.*, l.name as location_name, l.city
     FROM vehicle_subunits vs
     LEFT JOIN locations l ON vs.current_location_id = l.id
     WHERE vs.vehicle_id = $1 AND vs.status = 'available'`,
    [vehicleId]
  );

  if (subunitsResult.rows.length === 0) {
    // Log for debugging - check if vehicle has any subunits at all
    const allSubunitsResult = await pool.query(
      `SELECT id, status FROM vehicle_subunits WHERE vehicle_id = $1`,
      [vehicleId]
    );
    console.log(`Vehicle ${vehicleId} has ${allSubunitsResult.rows.length} total subunits, but ${subunitsResult.rows.length} available subunits`);
    if (allSubunitsResult.rows.length > 0) {
      console.log('Subunit statuses:', allSubunitsResult.rows.map((s: any) => ({ id: s.id, status: s.status })));
    }
    return { available: false, availableSubunits: [] };
  }

  // Check which subunits are booked in this date range
  // Include 'pending' status to match calendar view and prevent double bookings
  const bookingsResult = await pool.query(
    `SELECT DISTINCT vehicle_subunit_id
     FROM bookings
     WHERE vehicle_subunit_id IN (
       SELECT id FROM vehicle_subunits WHERE vehicle_id = $1
     )
     AND status IN ('pending', 'confirmed', 'active')
     AND (
       (pickup_date <= $2 AND dropoff_date >= $2)
       OR (pickup_date <= $3 AND dropoff_date >= $3)
       OR (pickup_date >= $2 AND dropoff_date <= $3)
     )`,
    [vehicleId, pickupDate, dropoffDate]
  );

  const bookedSubunitIds = new Set(
    bookingsResult.rows.map((b) => b.vehicle_subunit_id)
  );

  // Filter available subunits
  const availableSubunits = subunitsResult.rows.filter(
    (subunit) => !bookedSubunitIds.has(subunit.id)
  );

  return {
    available: availableSubunits.length > 0,
    availableSubunits,
  };
}

