import express, { Request, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';
import { calculatePricing } from '../services/pricing';
import { checkAvailability } from '../services/availability';

const router = express.Router();

// Create booking
router.post(
  '/',
  [
    body('customer').isObject(),
    body('vehicle_id').isUUID(),
    body('pickup_location_id').isUUID(),
    body('dropoff_location_id').isUUID(),
    body('pickup_date').isISO8601(),
    body('dropoff_date').isISO8601(),
    body('extras').optional().isArray(),
    body('coupon_code').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
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

      // Check availability
      const availability = await checkAvailability(
        vehicle_id,
        pickupDate,
        dropoffDate
      );

      if (!availability.available) {
        return res.status(400).json({ error: 'Vehicle not available for selected dates' });
      }

      // Select subunit if not provided
      let selectedSubunitId = vehicle_subunit_id;
      if (!selectedSubunitId) {
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

          // Update coupon usage
          await pool.query(
            'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1',
            [couponId]
          );
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
          'confirmed',
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

      res.status(201).json(fullBookingResult.rows[0]);
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Internal server error' });
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

