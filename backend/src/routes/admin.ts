import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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
       COUNT(CASE WHEN vs.status = 'available' THEN 1 END) as available_count,
       ARRAY_AGG(DISTINCT ve.extra_id) FILTER (WHERE ve.extra_id IS NOT NULL) as available_extras
       FROM vehicles v
       LEFT JOIN vehicle_subunits vs ON v.id = vs.vehicle_id
       LEFT JOIN vehicle_extras ve ON v.id = ve.vehicle_id
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
        color,
        features,
        images,
        available_extras,
        base_price_daily,
        base_price_weekly,
        base_price_monthly,
        base_price_hourly,
        minimum_rental_days,
        minimum_age,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO vehicles 
         (make, model, year, category, description, seats, transmission, fuel_type, color,
          features, images, base_price_daily, base_price_weekly, base_price_monthly, 
          base_price_hourly, minimum_rental_days, minimum_age)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
          color || null,
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

      const vehicleId = result.rows[0].id;

      // Handle vehicle extras
      if (available_extras && Array.isArray(available_extras) && available_extras.length > 0) {
        // Delete existing vehicle extras
        await pool.query('DELETE FROM vehicle_extras WHERE vehicle_id = $1', [vehicleId]);
        
        // Insert new vehicle extras
        for (const extraId of available_extras) {
          await pool.query(
            'INSERT INTO vehicle_extras (vehicle_id, extra_id) VALUES ($1, $2) ON CONFLICT (vehicle_id, extra_id) DO NOTHING',
            [vehicleId, extraId]
          );
        }
      }

      // Create vehicle subunit if license_plate is provided
      if (req.body.license_plate) {
        const { license_plate, vin, location_id, mileage } = req.body;
        
        // Check if license plate already exists
        const existingPlate = await pool.query(
          'SELECT id FROM vehicle_subunits WHERE license_plate = $1',
          [license_plate]
        );
        
        if (existingPlate.rows.length > 0) {
          // Rollback vehicle creation
          await pool.query('DELETE FROM vehicles WHERE id = $1', [vehicleId]);
          return res.status(400).json({ error: 'License plate already exists' });
        }

        // Check if VIN already exists (if provided)
        if (vin) {
          const existingVin = await pool.query(
            'SELECT id FROM vehicle_subunits WHERE vin = $1',
            [vin]
          );
          
          if (existingVin.rows.length > 0) {
            // Rollback vehicle creation
            await pool.query('DELETE FROM vehicles WHERE id = $1', [vehicleId]);
            return res.status(400).json({ error: 'VIN already exists' });
          }
        }

        await pool.query(
          `INSERT INTO vehicle_subunits 
           (vehicle_id, license_plate, vin, current_location_id, mileage, status)
           VALUES ($1, $2, $3, $4, $5, 'available')`,
          [
            vehicleId,
            license_plate,
            vin || null,
            location_id || null,
            mileage || 0,
          ]
        );
      }

      // Get vehicle with extras
      const vehicleWithExtras = await pool.query(
        `SELECT v.*, 
         ARRAY_AGG(ve.extra_id) FILTER (WHERE ve.extra_id IS NOT NULL) as available_extras
         FROM vehicles v
         LEFT JOIN vehicle_extras ve ON v.id = ve.vehicle_id
         WHERE v.id = $1
         GROUP BY v.id`,
        [vehicleId]
      );

      res.status(201).json(vehicleWithExtras.rows[0] || result.rows[0]);
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
      'color',
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

    // Handle vehicle extras if provided
    if (req.body.available_extras !== undefined) {
      const vehicleId = id;
      // Delete existing vehicle extras
      await pool.query('DELETE FROM vehicle_extras WHERE vehicle_id = $1', [vehicleId]);
      
      // Insert new vehicle extras if provided
      if (Array.isArray(req.body.available_extras) && req.body.available_extras.length > 0) {
        for (const extraId of req.body.available_extras) {
          await pool.query(
            'INSERT INTO vehicle_extras (vehicle_id, extra_id) VALUES ($1, $2) ON CONFLICT (vehicle_id, extra_id) DO NOTHING',
            [vehicleId, extraId]
          );
        }
      }
    }

    // Handle vehicle subunit update if location_id or mileage is provided
    if (req.body.location_id !== undefined || req.body.mileage !== undefined) {
      // Get the first subunit for this vehicle
      const subunitsResult = await pool.query(
        'SELECT id FROM vehicle_subunits WHERE vehicle_id = $1 ORDER BY created_at LIMIT 1',
        [id]
      );

      if (subunitsResult.rows.length > 0) {
        const subunitId = subunitsResult.rows[0].id;
        const subunitUpdateFields: string[] = [];
        const subunitParams: any[] = [];
        let subunitParamCount = 1;

        if (req.body.location_id !== undefined) {
          subunitUpdateFields.push(`current_location_id = $${subunitParamCount}`);
          subunitParams.push(req.body.location_id || null);
          subunitParamCount++;
        }

        if (req.body.mileage !== undefined) {
          subunitUpdateFields.push(`mileage = $${subunitParamCount}`);
          subunitParams.push(req.body.mileage || 0);
          subunitParamCount++;
        }

        if (subunitUpdateFields.length > 0) {
          subunitParams.push(subunitId);
          await pool.query(
            `UPDATE vehicle_subunits SET ${subunitUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $${subunitParamCount}`,
            subunitParams
          );
        }
      }
    }

    // Get vehicle with extras
    const vehicleWithExtras = await pool.query(
      `SELECT v.*, 
       ARRAY_AGG(ve.extra_id) FILTER (WHERE ve.extra_id IS NOT NULL) as available_extras
       FROM vehicles v
       LEFT JOIN vehicle_extras ve ON v.id = ve.vehicle_id
       WHERE v.id = $1
       GROUP BY v.id`,
      [id]
    );

    res.json(vehicleWithExtras.rows[0] || result.rows[0]);
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

// Availability overview - Get vehicles with subunits and bookings
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

    // Get vehicles with subunits
    let vehicleQuery = `
      SELECT 
        v.id,
        v.make,
        v.model,
        v.year,
        COUNT(DISTINCT vs.id) as total_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'available' THEN vs.id END) as available_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'rented' THEN vs.id END) as rented_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'maintenance' THEN vs.id END) as maintenance_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'damaged' THEN vs.id END) as damaged_subunits
      FROM vehicles v
      LEFT JOIN vehicle_subunits vs ON v.id = vs.vehicle_id
      WHERE 1=1
    `;
    const vehicleParams: any[] = [];
    let paramCount = 1;

    if (vehicle_id) {
      vehicleQuery += ` AND v.id = $${paramCount}`;
      vehicleParams.push(vehicle_id);
      paramCount++;
    }

    vehicleQuery += ` GROUP BY v.id, v.make, v.model, v.year ORDER BY v.make, v.model`;

    const vehiclesResult = await pool.query(vehicleQuery, vehicleParams);

    // Get bookings for the period
    let bookingsQuery = `SELECT 
        b.id,
        b.booking_number,
        b.vehicle_id,
        b.vehicle_subunit_id,
        b.pickup_date,
        b.dropoff_date,
        b.status as booking_status,
        vs.license_plate,
        vs.status as subunit_status,
        c.first_name || ' ' || c.last_name as customer_name
      FROM bookings b
      JOIN vehicle_subunits vs ON b.vehicle_subunit_id = vs.id
      JOIN vehicles v ON vs.vehicle_id = v.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.pickup_date < $1 AND b.dropoff_date > $2`;
    
    const bookingsParams: any[] = [endDate, startDate];
    let bookingsParamCount = 3;
    
    if (vehicle_id) {
      bookingsQuery += ` AND v.id = $${bookingsParamCount}`;
      bookingsParams.push(vehicle_id);
      bookingsParamCount++;
    }
    
    bookingsQuery += ` ORDER BY b.pickup_date`;
    
    const bookingsResult = await pool.query(bookingsQuery, bookingsParams);

    // Get availability notes
    let notesQuery = `SELECT 
        an.id,
        an.vehicle_id,
        an.vehicle_subunit_id,
        an.note_date,
        an.note,
        an.note_type,
        vs.license_plate
      FROM availability_notes an
      LEFT JOIN vehicle_subunits vs ON an.vehicle_subunit_id = vs.id
      WHERE an.note_date >= $1 AND an.note_date < $2`;
    
    const notesParams: any[] = [startDate, endDate];
    let notesParamCount = 3;
    
    if (vehicle_id) {
      notesQuery += ` AND (an.vehicle_id = $${notesParamCount} OR an.vehicle_subunit_id IN (SELECT id FROM vehicle_subunits WHERE vehicle_id = $${notesParamCount}))`;
      notesParams.push(vehicle_id);
      notesParamCount++;
    }
    
    notesQuery += ` ORDER BY an.note_date`;
    
    const notesResult = await pool.query(notesQuery, notesParams);

    res.json({
      vehicles: vehiclesResult.rows,
      bookings: bookingsResult.rows,
      availability_notes: notesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vehicle subunits with status
router.get('/vehicles/:id/subunits', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        vs.*,
        l.name as location_name,
        l.city as location_city
      FROM vehicle_subunits vs
      LEFT JOIN locations l ON vs.current_location_id = l.id
      WHERE vs.vehicle_id = $1
      ORDER BY vs.license_plate`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicle subunits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update vehicle subunit status
router.put('/vehicle-subunits/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'rented', 'maintenance', 'damaged'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE vehicle_subunits SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle subunit not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating subunit status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create availability note (block/unblock dates)
router.post(
  '/availability-notes',
  [
    body('note_date').isISO8601().toDate(),
    body('note').notEmpty(),
    body('note_type').isIn(['maintenance', 'blocked', 'special']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vehicle_id, vehicle_subunit_id, note_date, note, note_type } = req.body;

      if (!vehicle_id && !vehicle_subunit_id) {
        return res.status(400).json({ error: 'Either vehicle_id or vehicle_subunit_id is required' });
      }

      const authReq = req as any;
      const createdBy = authReq.user.id;

      const result = await pool.query(
        `INSERT INTO availability_notes 
         (vehicle_id, vehicle_subunit_id, note_date, note, note_type, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          vehicle_id || null,
          vehicle_subunit_id || null,
          note_date,
          note,
          note_type || 'maintenance',
          createdBy,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating availability note:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete availability note
router.delete('/availability-notes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM availability_notes WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Availability note not found' });
    }

    res.json({ message: 'Availability note deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability note:', error);
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

// Get all customers
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const { search, blacklisted } = req.query;

    let query = `
      SELECT c.*,
       COUNT(b.id) as total_bookings,
       COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END), 0) as total_spent
       FROM customers c
       LEFT JOIN bookings b ON c.id = b.customer_id
       WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        c.first_name ILIKE $${paramCount} OR 
        c.last_name ILIKE $${paramCount} OR 
        c.email ILIKE $${paramCount} OR 
        c.phone ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (blacklisted === 'true') {
      query += ` AND c.is_blacklisted = true`;
    } else if (blacklisted === 'false') {
      query += ` AND (c.is_blacklisted = false OR c.is_blacklisted IS NULL)`;
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer details with reservation history
router.get('/customers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get customer details
    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customerResult.rows[0];

    // Get reservation history
    const bookingsResult = await pool.query(
      `SELECT b.*, 
       v.make, v.model, v.year,
       pl.name as pickup_location_name,
       dl.name as dropoff_location_name
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN locations pl ON b.pickup_location_id = pl.id
       JOIN locations dl ON b.dropoff_location_id = dl.id
       WHERE b.customer_id = $1
       ORDER BY b.created_at DESC`,
      [id]
    );

    res.json({
      ...customer,
      bookings: bookingsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer blacklist status
router.put(
  '/customers/:id/blacklist',
  [body('is_blacklisted').isBoolean(), body('blacklist_reason').optional().isString()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { is_blacklisted, blacklist_reason } = req.body;

      const result = await pool.query(
        `UPDATE customers 
         SET is_blacklisted = $1, blacklist_reason = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [is_blacklisted, blacklist_reason || null, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating blacklist status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update customer information
router.put('/customers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      license_number,
      license_country,
      license_expiry,
      address,
      city,
      country,
    } = req.body;

    const result = await pool.query(
      `UPDATE customers SET 
       first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name),
       email = COALESCE($3, email),
       phone = COALESCE($4, phone),
       date_of_birth = COALESCE($5, date_of_birth),
       license_number = COALESCE($6, license_number),
       license_country = COALESCE($7, license_country),
       license_expiry = COALESCE($8, license_expiry),
       address = COALESCE($9, address),
       city = COALESCE($10, city),
       country = COALESCE($11, country),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        license_number,
        license_country,
        license_expiry,
        address,
        city,
        country,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post(
  '/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    body('role').optional().isIn(['admin']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role } = req.body;

      // Check if user exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at, updated_at',
        [email, passwordHash, name, role || 'admin']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update user
router.put(
  '/users/:id',
  [body('email').optional().isEmail().normalizeEmail(), body('name').optional().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { email, name } = req.body;

      // Check if user exists
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if email is being changed and if it's already taken
      if (email) {
        const emailCheck = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, id]
        );
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }

      const updateFields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (email) {
        updateFields.push(`email = $${paramCount}`);
        params.push(email);
        paramCount++;
      }

      if (name) {
        updateFields.push(`name = $${paramCount}`);
        params.push(name);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      params.push(id);

      const result = await pool.query(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} 
         RETURNING id, email, name, role, created_at, updated_at`,
        params
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update user password
router.put(
  '/users/:id/password',
  [body('password').isLength({ min: 6 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { password } = req.body;

      // Check if user exists
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10);

      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, id]
      );

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete user
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as any;

    // Prevent deleting yourself
    if (authReq.user.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all extras (admin - includes inactive)
router.get('/extras', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM extras ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching extras:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get extra by ID
router.get('/extras/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM extras WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Extra not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching extra:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create extra
router.post(
  '/extras',
  [
    body('name').notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('price_type').isIn(['per_rental', 'per_day', 'per_week']),
    body('description').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, price, price_type, is_active, cover_image } = req.body;

      const result = await pool.query(
        `INSERT INTO extras (name, description, price, price_type, is_active, cover_image)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, description || null, price, price_type || 'per_rental', is_active !== undefined ? is_active : true, cover_image || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating extra:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update extra
router.put(
  '/extras/:id',
  [
    body('name').optional().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('price_type').optional().isIn(['per_rental', 'per_day', 'per_week']),
    body('description').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      const allowedFields = ['name', 'description', 'price', 'price_type', 'is_active', 'cover_image'];

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
        `UPDATE extras SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Extra not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating extra:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete extra
router.delete('/extras/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if extra is used in any bookings
    const bookingsResult = await pool.query(
      'SELECT COUNT(*) as count FROM booking_extras WHERE extra_id = $1',
      [id]
    );

    if (parseInt(bookingsResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete extra that has been used in bookings. Deactivate it instead.',
      });
    }

    // Check if extra is assigned to any vehicles
    const vehiclesResult = await pool.query(
      'SELECT COUNT(*) as count FROM vehicle_extras WHERE extra_id = $1',
      [id]
    );

    if (parseInt(vehiclesResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete extra that is assigned to vehicles. Remove it from vehicles first or deactivate it.',
      });
    }

    const result = await pool.query('DELETE FROM extras WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Extra not found' });
    }

    res.json({ message: 'Extra deleted successfully' });
  } catch (error) {
    console.error('Error deleting extra:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

