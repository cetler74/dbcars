import express, { Request, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';
import { calculatePricing } from '../services/pricing';
import { checkAvailability } from '../services/availability';
import { sendBookingEmail } from '../services/email';

const router = express.Router();

// Create booking
router.post(
  '/',
  [
    body('customer').isObject().withMessage('Customer must be an object'),
    body('customer.first_name').notEmpty().withMessage('Customer first name is required'),
    body('customer.last_name').notEmpty().withMessage('Customer last name is required'),
    body('customer.email').isEmail().withMessage('Customer email must be a valid email'),
    body('customer.phone').notEmpty().withMessage('Customer phone is required'),
    body('vehicle_id').isUUID().withMessage('Vehicle ID must be a valid UUID'),
    body('pickup_location_id').isUUID().withMessage('Pickup location ID must be a valid UUID'),
    body('dropoff_location_id').isUUID().withMessage('Dropoff location ID must be a valid UUID'),
    body('pickup_date').isISO8601().withMessage('Pickup date must be in ISO8601 format'),
    body('dropoff_date').isISO8601().withMessage('Dropoff date must be in ISO8601 format'),
    body('extras').optional().isArray().withMessage('Extras must be an array'),
    body('coupon_code').optional().isString().withMessage('Coupon code must be a string'),
  ],
  async (req: Request, res: Response) => {
    try {
      console.log('Booking request received:', {
        vehicle_id: req.body.vehicle_id,
        pickup_location_id: req.body.pickup_location_id,
        dropoff_location_id: req.body.dropoff_location_id,
        pickup_date: req.body.pickup_date,
        dropoff_date: req.body.dropoff_date,
        customer: req.body.customer ? { ...req.body.customer, phone: req.body.customer.phone?.substring(0, 10) + '...' } : null,
      });
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', JSON.stringify(errors.array(), null, 2));
        const errorDetails = errors.array().map((e: any) => {
          const param = e.param || e.path || 'unknown';
          const msg = e.msg || 'Invalid value';
          return `${param}: ${msg}`;
        }).join(', ');
        
        // Serialize errors properly to avoid circular references
        const serializedErrors = errors.array().map((e: any) => ({
          param: e.param || e.path || 'unknown',
          msg: e.msg || 'Invalid value',
          value: e.value !== undefined ? String(e.value) : undefined,
          location: e.location || 'body'
        }));
        
        return res.status(400).json({ 
          error: 'Validation failed',
          errors: serializedErrors,
          details: errorDetails
        });
      }

      const {
        customer,
        vehicle_id,
        vehicle_subunit_id,
        pickup_location_id,
        dropoff_location_id,
        pickup_date,
        dropoff_date,
        extras = [],
        coupon_code,
        notes,
      } = req.body;

      const pickupDate = new Date(pickup_date);
      const dropoffDate = new Date(dropoff_date);

      // Validate minimum 1 day (24 hours) rental period
      const timeDiff = dropoffDate.getTime() - pickupDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        return res.status(400).json({ 
          error: 'Minimum rental period is 1 day (24 hours)',
          details: `Selected rental period is ${Math.round(hoursDiff * 10) / 10} hours. Minimum required is 24 hours.`
        });
      }

      // Check availability
      const availability = await checkAvailability(
        vehicle_id,
        pickupDate,
        dropoffDate
      );

      if (!availability.available) {
        console.error('Availability check failed:', {
          vehicle_id,
          pickupDate: pickupDate.toISOString(),
          dropoffDate: dropoffDate.toISOString(),
          availableSubunits: availability.availableSubunits?.length || 0,
          blockedDates: availability.blockedDates || [],
        });
        return res.status(400).json({ 
          error: 'Vehicle not available for selected dates',
          details: availability.blockedDates ? 'Blocked dates found' : 'No available vehicle units',
          blockedDates: availability.blockedDates || null
        });
      }

      // Select subunit if not provided
      let selectedSubunitId = vehicle_subunit_id;
      if (!selectedSubunitId) {
        if (availability.availableSubunits.length === 0) {
          return res.status(400).json({ error: 'No available vehicle units for selected dates' });
        }
        selectedSubunitId = availability.availableSubunits[0].id;
      }

      // Calculate pricing
      const pricing = await calculatePricing({
        vehicleId: vehicle_id,
        pickupDate,
        dropoffDate,
        pickupLocationId: pickup_location_id,
      });

      // Calculate extras price
      let extrasPrice = 0;
      if (extras.length > 0) {
        const extrasResult = await pool.query(
          `SELECT id, price, price_type FROM extras WHERE id = ANY($1::uuid[])`,
          [extras.map((e: any) => e.id)]
        );

        extras.forEach((extra: any) => {
          const extraData = extrasResult.rows.find((e) => e.id === extra.id);
          if (extraData) {
            if (extraData.price_type === 'per_day') {
              extrasPrice += extraData.price * pricing.days * (extra.quantity || 1);
            } else {
              extrasPrice += extraData.price * (extra.quantity || 1);
            }
          }
        });
      }

      // Apply coupon if provided
      let discountAmount = 0;
      let couponId = null;
      if (coupon_code) {
        const couponResult = await pool.query(
          `SELECT * FROM coupons 
           WHERE code = $1 
           AND is_active = true 
           AND valid_from <= CURRENT_DATE 
           AND valid_until >= CURRENT_DATE
           AND (usage_limit IS NULL OR usage_count < usage_limit)`,
          [coupon_code.toUpperCase()]
        );

        if (couponResult.rows.length > 0) {
          const coupon = couponResult.rows[0];
          couponId = coupon.id;

          if (coupon.discount_type === 'percentage') {
            discountAmount = (pricing.base_price + extrasPrice) * (coupon.discount_value / 100);
          } else {
            discountAmount = coupon.discount_value;
          }

          // Note: Coupon usage_count is incremented when booking status changes to 'confirmed' in admin route
        }
      }

      const totalPrice = pricing.base_price + extrasPrice - discountAmount;

      // Create or get customer
      let customerResult = await pool.query(
        'SELECT id FROM customers WHERE email = $1',
        [customer.email]
      );

      let customerId;
      if (customerResult.rows.length > 0) {
        customerId = customerResult.rows[0].id;
        // Update customer info
        await pool.query(
          `UPDATE customers SET 
           first_name = $1, last_name = $2, phone = $3,
           date_of_birth = $4, license_number = $5, license_country = $6,
           license_expiry = $7, address = $8, city = $9, country = $10
           WHERE id = $11`,
          [
            customer.first_name,
            customer.last_name,
            customer.phone,
            customer.date_of_birth || null,
            customer.license_number || null,
            customer.license_country || null,
            customer.license_expiry || null,
            customer.address || null,
            customer.city || null,
            customer.country || null,
            customerId,
          ]
        );
      } else {
        const newCustomerResult = await pool.query(
          `INSERT INTO customers 
           (first_name, last_name, email, phone, date_of_birth, license_number, license_country, license_expiry, address, city, country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id`,
          [
            customer.first_name,
            customer.last_name,
            customer.email,
            customer.phone,
            customer.date_of_birth || null,
            customer.license_number || null,
            customer.license_country || null,
            customer.license_expiry || null,
            customer.address || null,
            customer.city || null,
            customer.country || null,
          ]
        );
        customerId = newCustomerResult.rows[0].id;
      }

      // Generate booking number
      const bookingNumber = `DB-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Create booking
      const bookingResult = await pool.query(
        `INSERT INTO bookings 
         (booking_number, customer_id, vehicle_id, vehicle_subunit_id, 
          pickup_location_id, dropoff_location_id, pickup_date, dropoff_date,
          status, total_price, base_price, extras_price, discount_amount, coupon_code, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          bookingNumber,
          customerId,
          vehicle_id,
          selectedSubunitId,
          pickup_location_id,
          dropoff_location_id,
          pickupDate,
          dropoffDate,
          'pending',
          totalPrice,
          pricing.base_price,
          extrasPrice,
          discountAmount,
          coupon_code || null,
          notes || null,
        ]
      );

      const booking = bookingResult.rows[0];

      // Add booking extras
      if (extras.length > 0) {
        for (const extra of extras) {
          const extraDataResult = await pool.query(
            'SELECT price FROM extras WHERE id = $1',
            [extra.id]
          );
          if (extraDataResult.rows.length > 0) {
            await pool.query(
              `INSERT INTO booking_extras (booking_id, extra_id, quantity, price)
               VALUES ($1, $2, $3, $4)`,
              [
                booking.id,
                extra.id,
                extra.quantity || 1,
                extraDataResult.rows[0].price,
              ]
            );
          }
        }
      }

      // Get full booking details
      const fullBookingResult = await pool.query(
        `SELECT b.*, 
         c.first_name, c.last_name, c.email, c.phone,
         v.make, v.model, v.year,
         pl.name as pickup_location_name, dl.name as dropoff_location_name
         FROM bookings b
         JOIN customers c ON b.customer_id = c.id
         JOIN vehicles v ON b.vehicle_id = v.id
         JOIN locations pl ON b.pickup_location_id = pl.id
         JOIN locations dl ON b.dropoff_location_id = dl.id
         WHERE b.id = $1`,
        [booking.id]
      );

      const fullBooking = fullBookingResult.rows[0];

      // Fire-and-forget email sending (do not block booking creation if email fails)
      sendBookingEmail({
        booking_number: fullBooking.booking_number,
        pickup_date: fullBooking.pickup_date,
        dropoff_date: fullBooking.dropoff_date,
        total_price: Number(fullBooking.total_price),
        base_price: Number(fullBooking.base_price),
        extras_price: Number(fullBooking.extras_price),
        discount_amount: Number(fullBooking.discount_amount || 0),
        first_name: fullBooking.first_name,
        last_name: fullBooking.last_name,
        email: fullBooking.email,
        phone: fullBooking.phone,
        make: fullBooking.make,
        model: fullBooking.model,
        year: fullBooking.year,
        pickup_location_name: fullBooking.pickup_location_name,
        dropoff_location_name: fullBooking.dropoff_location_name,
      }).catch((err) => {
        console.error('[Brevo] Error sending booking email (non-blocking):', err);
      });

      res.status(201).json(fullBooking);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack,
      });
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get booking by booking number
router.get('/:bookingNumber', async (req: Request, res: Response) => {
  try {
    const { bookingNumber } = req.params;

    const result = await pool.query(
      `SELECT b.*, 
       c.first_name, c.last_name, c.email, c.phone,
       v.make, v.model, v.year, v.images,
       pl.name as pickup_location_name, pl.address as pickup_location_address,
       dl.name as dropoff_location_name, dl.address as dropoff_location_address,
       json_agg(DISTINCT jsonb_build_object(
         'id', e.id,
         'name', e.name,
         'quantity', be.quantity,
         'price', be.price
       )) FILTER (WHERE be.id IS NOT NULL) as booking_extras
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN locations pl ON b.pickup_location_id = pl.id
       JOIN locations dl ON b.dropoff_location_id = dl.id
       LEFT JOIN booking_extras be ON b.id = be.booking_id
       LEFT JOIN extras e ON be.extra_id = e.id
       WHERE b.booking_number = $1
       GROUP BY b.id, c.id, v.id, pl.id, dl.id`,
      [bookingNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

