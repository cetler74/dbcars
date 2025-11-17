import express, { Request, Response } from 'express';
import pool from '../config/database';
import { ACTIVE_BOOKING_STATUSES } from '../services/availability';

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
             AND b.status = ANY($4::text[])
             AND (b.pickup_date <= $3 AND b.dropoff_date >= $2)`,
            [vehicle.id, fromDate, toDate, ACTIVE_BOOKING_STATUSES]
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

// Get vehicle blocked dates for date picker (must come before /:id route)
router.get('/:id/blocked-dates', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const targetDate = new Date();
    const targetMonth = month ? parseInt(month as string) : targetDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : targetDate.getFullYear();

    // Get a wider range: current date to 12 months forward to cover calendar navigation
    const firstDay = new Date(); // Start from today
    const lastDay = new Date();
    lastDay.setFullYear(lastDay.getFullYear() + 1); // 12 months ahead

    // Get all active bookings
    const bookingsResult = await pool.query(
      `SELECT b.pickup_date, b.dropoff_date, b.status as booking_status
       FROM bookings b
       JOIN vehicle_subunits vs ON b.vehicle_subunit_id = vs.id
       WHERE vs.vehicle_id = $1
       AND b.status NOT IN ('cancelled')
       AND (
         (b.pickup_date <= $3 AND b.dropoff_date >= $2)
         OR (b.pickup_date >= $2 AND b.dropoff_date <= $3)
       )
       ORDER BY b.pickup_date`,
      [id, firstDay, lastDay]
    );

    // Get availability notes (maintenance/blocked)
    const notesResult = await pool.query(
      `SELECT note_date, note_type
       FROM availability_notes
       WHERE vehicle_id = $1
       AND note_date >= $2
       AND note_date <= $3
       AND note_type IN ('maintenance', 'blocked')`,
      [id, firstDay, lastDay]
    );

    res.json({
      bookings: bookingsResult.rows,
      blocked_dates: notesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check vehicle availability (must come before /:id route)
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
    // Use standardized active booking statuses to prevent double bookings
    const bookingsResult = await pool.query(
      `SELECT vehicle_subunit_id, pickup_date, dropoff_date
       FROM bookings
       WHERE vehicle_subunit_id IN (
         SELECT id FROM vehicle_subunits WHERE vehicle_id = $1
       )
       AND status = ANY($4::text[])
       AND (pickup_date <= $3 AND dropoff_date >= $2)`,
      [id, fromDate, toDate, ACTIVE_BOOKING_STATUSES]
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

// Get single vehicle by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First, get the vehicle basic info
    const vehicleResult = await pool.query(
      `SELECT * FROM vehicles WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = vehicleResult.rows[0];

    // Get subunits separately to avoid json_agg issues
    const subunitsResult = await pool.query(
      `SELECT * FROM vehicle_subunits WHERE vehicle_id = $1`,
      [id]
    );

    // Get images if they exist in a separate column or table
    // For now, we'll handle images from the vehicle record itself
    const images = vehicle.images || [];
    
    // Parse images if it's a string (JSON)
    let parsedImages = images;
    if (typeof images === 'string') {
      try {
        parsedImages = JSON.parse(images);
      } catch (e) {
        parsedImages = images ? [images] : [];
      }
    }
    if (!Array.isArray(parsedImages)) {
      parsedImages = parsedImages ? [parsedImages] : [];
    }

    // Parse features if it's a string (JSON)
    let parsedFeatures = vehicle.features || [];
    if (typeof vehicle.features === 'string') {
      try {
        parsedFeatures = JSON.parse(vehicle.features);
      } catch (e) {
        parsedFeatures = vehicle.features ? [vehicle.features] : [];
      }
    }
    if (!Array.isArray(parsedFeatures)) {
      parsedFeatures = parsedFeatures ? [parsedFeatures] : [];
    }

    // Combine all data
    const vehicleData = {
      ...vehicle,
      subunits: subunitsResult.rows,
      images: parsedImages,
      features: parsedFeatures,
    };

    res.json(vehicleData);
  } catch (error: any) {
    console.error('Error fetching vehicle:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

