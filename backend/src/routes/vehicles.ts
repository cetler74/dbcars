import express, { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// Get all vehicles with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, location, available_from, available_to, min_price, max_price } = req.query;

    let query = `
      SELECT 
        v.*,
        json_agg(DISTINCT vs.*) FILTER (WHERE vs.id IS NOT NULL) as subunits,
        json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL) as available_locations
      FROM vehicles v
      LEFT JOIN vehicle_subunits vs ON v.id = vs.vehicle_id AND vs.status = 'available'
      LEFT JOIN locations l ON vs.current_location_id = l.id
      WHERE v.is_active = true
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND v.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (min_price) {
      query += ` AND v.base_price_daily >= $${paramCount}`;
      params.push(min_price);
      paramCount++;
    }

    if (max_price) {
      query += ` AND v.base_price_daily <= $${paramCount}`;
      params.push(max_price);
      paramCount++;
    }

    query += ` GROUP BY v.id ORDER BY v.created_at DESC`;

    const result = await pool.query(query, params);

    // Filter by availability if dates provided
    let vehicles = result.rows;
    if (available_from && available_to) {
      const fromDate = new Date(available_from as string);
      const toDate = new Date(available_to as string);

      // Check availability for each vehicle
      const availabilityChecks = await Promise.all(
        vehicles.map(async (vehicle) => {
          const availabilityResult = await pool.query(
            `SELECT COUNT(*) as count
             FROM bookings b
             JOIN vehicle_subunits vs ON b.vehicle_subunit_id = vs.id
             WHERE vs.vehicle_id = $1
             AND b.status IN ('confirmed', 'active')
             AND (
               (b.pickup_date <= $2 AND b.dropoff_date >= $2)
               OR (b.pickup_date <= $3 AND b.dropoff_date >= $3)
               OR (b.pickup_date >= $2 AND b.dropoff_date <= $3)
             )`,
            [vehicle.id, fromDate, toDate]
          );

          const bookedCount = parseInt(availabilityResult.rows[0].count);
          const totalSubunits = vehicle.subunits?.length || 0;
          return {
            ...vehicle,
            is_available: bookedCount < totalSubunits,
            available_count: Math.max(0, totalSubunits - bookedCount),
          };
        })
      );

      vehicles = availabilityChecks.filter((v) => v.is_available);
    }

    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single vehicle by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vehicleResult = await pool.query(
      `SELECT v.*, 
       json_agg(DISTINCT vs.*) FILTER (WHERE vs.id IS NOT NULL) as subunits
       FROM vehicles v
       LEFT JOIN vehicle_subunits vs ON v.id = vs.vehicle_id
       WHERE v.id = $1
       GROUP BY v.id`,
      [id]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicleResult.rows[0]);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check vehicle availability
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to dates are required' });
    }

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    // Get all subunits for this vehicle
    const subunitsResult = await pool.query(
      'SELECT id FROM vehicle_subunits WHERE vehicle_id = $1',
      [id]
    );

    const totalSubunits = subunitsResult.rows.length;

    // Check bookings in this date range
    const bookingsResult = await pool.query(
      `SELECT vehicle_subunit_id, pickup_date, dropoff_date
       FROM bookings
       WHERE vehicle_subunit_id IN (
         SELECT id FROM vehicle_subunits WHERE vehicle_id = $1
       )
       AND status IN ('confirmed', 'active')
       AND (
         (pickup_date <= $2 AND dropoff_date >= $2)
         OR (pickup_date <= $3 AND dropoff_date >= $3)
         OR (pickup_date >= $2 AND dropoff_date <= $3)
       )`,
      [id, fromDate, toDate]
    );

    const bookedSubunits = new Set(bookingsResult.rows.map((b) => b.vehicle_subunit_id));
    const availableCount = totalSubunits - bookedSubunits.size;

    res.json({
      available: availableCount > 0,
      available_count: availableCount,
      total_count: totalSubunits,
      booked_dates: bookingsResult.rows.map((b) => ({
        from: b.pickup_date,
        to: b.dropoff_date,
      })),
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

