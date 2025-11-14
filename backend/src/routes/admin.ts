import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);
router.use(requireAdmin);

// Dashboard statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's pickups
    const pickupsResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE DATE(pickup_date) = CURRENT_DATE 
       AND status IN ('confirmed', 'active')`
    );

    // Today's returns
    const returnsResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE DATE(dropoff_date) = CURRENT_DATE 
       AND status IN ('active', 'completed')`
    );

    // Total revenue (this month)
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) as revenue 
       FROM bookings 
       WHERE status = 'completed' 
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    // Total bookings (this month)
    const bookingsResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    // Upcoming reservations (next 7 days)
    const upcomingResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE pickup_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       AND status = 'confirmed'`
    );

    res.json({
      today_pickups: parseInt(pickupsResult.rows[0].count),
      today_returns: parseInt(returnsResult.rows[0].count),
      monthly_revenue: parseFloat(revenueResult.rows[0].revenue),
      monthly_bookings: parseInt(bookingsResult.rows[0].count),
      upcoming_reservations: parseInt(upcomingResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all bookings
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const { status, vehicle_id, date_from, date_to } = req.query;

    let query = `
      SELECT b.*, 
       c.first_name, c.last_name, c.email, c.phone,
       v.make, v.model, v.year,
       pl.name as pickup_location_name,
       dl.name as dropoff_location_name
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN locations pl ON b.pickup_location_id = pl.id
       JOIN locations dl ON b.dropoff_location_id = dl.id
       WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND b.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (vehicle_id) {
      query += ` AND b.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }

    if (date_from) {
      query += ` AND b.pickup_date >= $${paramCount}`;
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      query += ` AND b.pickup_date <= $${paramCount}`;
      params.push(date_to);
      paramCount++;
    }

    query += ` ORDER BY b.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status
router.put('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateFields: string[] = ['status = $1'];
    const params: any[] = [status];
    let paramCount = 2;

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE bookings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all vehicles (admin)
router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT v.*, 
       COUNT(vs.id) as subunit_count,
       COUNT(CASE WHEN vs.status = 'available' THEN 1 END) as available_count
       FROM vehicles v
       LEFT JOIN vehicle_subunits vs ON v.id = vs.vehicle_id
       GROUP BY v.id
       ORDER BY v.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create vehicle
router.post(
  '/vehicles',
  [
    body('make').notEmpty(),
    body('model').notEmpty(),
    body('year').isInt({ min: 1900, max: 2100 }),
    body('category').notEmpty(),
    body('base_price_daily').isFloat({ min: 0 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        make,
        model,
        year,
        category,
        description,
        seats,
        transmission,
        fuel_type,
        features,
        images,
        base_price_daily,
        base_price_weekly,
        base_price_monthly,
        base_price_hourly,
        minimum_rental_days,
        minimum_age,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO vehicles 
         (make, model, year, category, description, seats, transmission, fuel_type, 
          features, images, base_price_daily, base_price_weekly, base_price_monthly, 
          base_price_hourly, minimum_rental_days, minimum_age)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING *`,
        [
          make,
          model,
          year,
          category,
          description || null,
          seats || 4,
          transmission || 'automatic',
          fuel_type || 'gasoline',
          features || [],
          images || [],
          base_price_daily,
          base_price_weekly || null,
          base_price_monthly || null,
          base_price_hourly || null,
          minimum_rental_days || 1,
          minimum_age || 25,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update vehicle
router.put('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    const allowedFields = [
      'make',
      'model',
      'year',
      'category',
      'description',
      'seats',
      'transmission',
      'fuel_type',
      'features',
      'images',
      'base_price_daily',
      'base_price_weekly',
      'base_price_monthly',
      'base_price_hourly',
      'minimum_rental_days',
      'minimum_age',
      'is_active',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        params.push(req.body[field]);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE vehicles SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vehicle
router.delete('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if vehicle has active bookings
    const bookingsResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE vehicle_id = $1 AND status IN ('confirmed', 'active')`,
      [id]
    );

    if (parseInt(bookingsResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete vehicle with active bookings. Deactivate it instead.',
      });
    }

    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Availability overview
router.get('/availability', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, month, year } = req.query;

    const startDate = new Date(
      parseInt(year as string) || new Date().getFullYear(),
      (parseInt(month as string) || new Date().getMonth()) - 1,
      1
    );
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    let query = `
      SELECT 
        v.id as vehicle_id,
        v.make,
        v.model,
        b.pickup_date,
        b.dropoff_date,
        b.status,
        COUNT(vs.id) as total_subunits
      FROM vehicles v
      LEFT JOIN vehicle_subunits vs ON v.id = vs.vehicle_id
      LEFT JOIN bookings b ON vs.id = b.vehicle_subunit_id
        AND b.status IN ('confirmed', 'active')
        AND b.pickup_date < $1 AND b.dropoff_date > $2
      WHERE 1=1
    `;
    const params: any[] = [endDate, startDate];
    let paramCount = 3;

    if (vehicle_id) {
      query += ` AND v.id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }

    query += ` GROUP BY v.id, v.make, v.model, b.pickup_date, b.dropoff_date, b.status`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log vehicle damage
router.post(
  '/damage-logs',
  [
    body('vehicle_subunit_id').isUUID(),
    body('damage_description').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        vehicle_subunit_id,
        booking_id,
        damage_description,
        damage_location,
        repair_cost,
        images,
      } = req.body;

      const authReq = req as any;
      const reportedBy = authReq.user.id;

      const result = await pool.query(
        `INSERT INTO damage_logs 
         (vehicle_subunit_id, booking_id, damage_description, damage_location, repair_cost, images, reported_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          vehicle_subunit_id,
          booking_id || null,
          damage_description,
          damage_location || null,
          repair_cost || null,
          images || [],
          reportedBy,
        ]
      );

      // Update subunit status if needed
      if (repair_cost) {
        await pool.query(
          'UPDATE vehicle_subunits SET status = $1 WHERE id = $2',
          ['damaged', vehicle_subunit_id]
        );
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error logging damage:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

