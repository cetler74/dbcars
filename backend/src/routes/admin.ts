import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { sendBookingStatusEmail } from '../services/email';

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);
router.use(requireAdmin);

// Dashboard statistics - comprehensive data from all areas
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ========== BOOKINGS STATISTICS ==========
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

    // Total revenue (this month) - includes confirmed and completed bookings
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) as revenue 
       FROM bookings 
       WHERE status IN ('confirmed', 'active', 'completed') 
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

    // Pending bookings
    const pendingResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'`
    );

    // Active rentals
    const activeResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings WHERE status = 'active'`
    );

    // Total revenue (all time) - includes confirmed and completed bookings
    const totalRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) as revenue 
       FROM bookings WHERE status IN ('confirmed', 'active', 'completed')`
    );

    // Status breakdown
    const statusBreakdownResult = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM bookings 
       GROUP BY status`
    );

    // Recent bookings (last 5)
    const recentBookingsResult = await pool.query(
      `SELECT b.*, 
       c.first_name, c.last_name, c.email,
       v.make, v.model, v.year
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN vehicles v ON b.vehicle_id = v.id
       ORDER BY b.created_at DESC
       LIMIT 5`
    );

    // Upcoming pickups (next 7 days with details)
    const upcomingPickupsResult = await pool.query(
      `SELECT b.*, 
       c.first_name, c.last_name, c.email, c.phone,
       v.make, v.model, v.year,
       pl.name as pickup_location_name
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN locations pl ON b.pickup_location_id = pl.id
       WHERE b.pickup_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       AND b.status IN ('confirmed', 'active')
       ORDER BY b.pickup_date ASC
       LIMIT 10`
    );

    // Upcoming returns (next 7 days with details)
    const upcomingReturnsResult = await pool.query(
      `SELECT b.*, 
       c.first_name, c.last_name, c.email, c.phone,
       v.make, v.model, v.year,
       dl.name as dropoff_location_name
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN locations dl ON b.dropoff_location_id = dl.id
       WHERE b.dropoff_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       AND b.status IN ('active', 'completed')
       ORDER BY b.dropoff_date ASC
       LIMIT 10`
    );

    // Revenue comparison (this month vs last month) - includes confirmed and completed bookings
    const lastMonthRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) as revenue 
       FROM bookings 
       WHERE status IN ('confirmed', 'active', 'completed') 
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`
    );

    // ========== VEHICLE STATISTICS ==========
    // Total vehicles
    const totalVehiclesResult = await pool.query(
      `SELECT COUNT(*) as count FROM vehicles WHERE is_active = true`
    );

    // Vehicles by category
    const vehiclesByCategoryResult = await pool.query(
      `SELECT category, COUNT(*) as count 
       FROM vehicles 
       WHERE is_active = true 
       GROUP BY category 
       ORDER BY count DESC`
    );

    // Most popular vehicles (by number of bookings)
    const popularVehiclesResult = await pool.query(
      `SELECT v.id, v.make, v.model, v.year, v.category,
       COUNT(b.id) as booking_count,
       COALESCE(SUM(b.total_price), 0) as total_revenue
       FROM vehicles v
       LEFT JOIN bookings b ON v.id = b.vehicle_id AND b.status IN ('confirmed', 'active', 'completed')
       WHERE v.is_active = true
       GROUP BY v.id, v.make, v.model, v.year, v.category
       ORDER BY booking_count DESC
       LIMIT 5`
    );

    // Vehicle utilization (percentage of time booked)
    const vehicleUtilizationResult = await pool.query(
      `SELECT v.id, v.make, v.model,
       COUNT(DISTINCT vs.id) as total_subunits,
       COUNT(DISTINCT CASE WHEN vs.status = 'out_on_rent' THEN vs.id END) as rented_subunits,
       COUNT(DISTINCT CASE WHEN vs.status = 'available' THEN vs.id END) as available_subunits
       FROM vehicles v
       LEFT JOIN vehicle_subunits vs ON v.id = vs.vehicle_id
       WHERE v.is_active = true
       GROUP BY v.id, v.make, v.model
       ORDER BY total_subunits DESC
       LIMIT 10`
    );

    // ========== CUSTOMER STATISTICS ==========
    // Total customers
    const totalCustomersResult = await pool.query(
      `SELECT COUNT(*) as count FROM customers`
    );

    // New customers this month
    const newCustomersResult = await pool.query(
      `SELECT COUNT(*) as count FROM customers 
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    // Top customers by revenue
    const topCustomersResult = await pool.query(
      `SELECT c.id, c.first_name, c.last_name, c.email,
       COUNT(b.id) as booking_count,
       COALESCE(SUM(b.total_price), 0) as total_spent
       FROM customers c
       LEFT JOIN bookings b ON c.id = b.customer_id AND b.status IN ('confirmed', 'active', 'completed')
       GROUP BY c.id, c.first_name, c.last_name, c.email
       ORDER BY total_spent DESC
       LIMIT 5`
    );

    // Customer repeat rate
    const repeatCustomersResult = await pool.query(
      `SELECT 
       COUNT(DISTINCT customer_id) as total_customers_with_bookings,
       COUNT(DISTINCT CASE WHEN booking_count > 1 THEN customer_id END) as repeat_customers
       FROM (
         SELECT customer_id, COUNT(*) as booking_count
         FROM bookings
         GROUP BY customer_id
       ) as customer_bookings`
    );

    // ========== REVENUE BY CATEGORY ==========
    const revenueByCategoryResult = await pool.query(
      `SELECT v.category, 
       COALESCE(SUM(b.total_price), 0) as revenue,
       COUNT(b.id) as booking_count
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.status IN ('confirmed', 'active', 'completed')
       GROUP BY v.category
       ORDER BY revenue DESC`
    );

    // ========== REVENUE BY LOCATION ==========
    const revenueByLocationResult = await pool.query(
      `SELECT l.name as location_name, l.city,
       COALESCE(SUM(b.total_price), 0) as revenue,
       COUNT(b.id) as booking_count
       FROM bookings b
       JOIN locations l ON b.pickup_location_id = l.id
       WHERE b.status IN ('confirmed', 'active', 'completed')
       GROUP BY l.id, l.name, l.city
       ORDER BY revenue DESC
       LIMIT 10`
    );

    // ========== EXTRAS STATISTICS ==========
    const totalExtrasResult = await pool.query(
      `SELECT COUNT(*) as count FROM extras WHERE is_active = true`
    );

    const popularExtrasResult = await pool.query(
      `SELECT e.id, e.name, e.price, e.price_type,
       COUNT(be.booking_id) as times_booked,
       COALESCE(SUM(be.price * be.quantity), 0) as total_revenue
       FROM extras e
       LEFT JOIN booking_extras be ON e.id = be.extra_id
       WHERE e.is_active = true
       GROUP BY e.id, e.name, e.price, e.price_type
       ORDER BY times_booked DESC
       LIMIT 5`
    );

    // ========== BLOG STATISTICS ==========
    const totalBlogPostsResult = await pool.query(
      `SELECT COUNT(*) as count FROM blog_posts WHERE is_published = true`
    );

    // ========== PROCESS RESULTS ==========
    const statusBreakdown: any = {};
    statusBreakdownResult.rows.forEach((row: any) => {
      statusBreakdown[row.status] = parseInt(row.count);
    });

    const thisMonthRevenue = parseFloat(revenueResult.rows[0].revenue);
    const lastMonthRevenue = parseFloat(lastMonthRevenueResult.rows[0].revenue);
    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : '0';

    const totalCustomersWithBookings = parseInt(repeatCustomersResult.rows[0]?.total_customers_with_bookings || 0);
    const repeatCustomers = parseInt(repeatCustomersResult.rows[0]?.repeat_customers || 0);
    const repeatRate = totalCustomersWithBookings > 0 
      ? ((repeatCustomers / totalCustomersWithBookings) * 100).toFixed(1)
      : '0';

    res.json({
      // Bookings data
      today_pickups: parseInt(pickupsResult.rows[0].count),
      today_returns: parseInt(returnsResult.rows[0].count),
      monthly_revenue: thisMonthRevenue,
      monthly_bookings: parseInt(bookingsResult.rows[0].count),
      upcoming_reservations: parseInt(upcomingResult.rows[0].count),
      pending_bookings: parseInt(pendingResult.rows[0].count),
      active_rentals: parseInt(activeResult.rows[0].count),
      total_revenue: parseFloat(totalRevenueResult.rows[0].revenue),
      status_breakdown: statusBreakdown,
      recent_bookings: recentBookingsResult.rows,
      upcoming_pickups: upcomingPickupsResult.rows,
      upcoming_returns: upcomingReturnsResult.rows,
      revenue_change: revenueChange,
      
      // Vehicle statistics
      total_vehicles: parseInt(totalVehiclesResult.rows[0].count),
      vehicles_by_category: vehiclesByCategoryResult.rows,
      popular_vehicles: popularVehiclesResult.rows,
      vehicle_utilization: vehicleUtilizationResult.rows,
      
      // Customer statistics
      total_customers: parseInt(totalCustomersResult.rows[0].count),
      new_customers_this_month: parseInt(newCustomersResult.rows[0].count),
      top_customers: topCustomersResult.rows,
      repeat_customer_rate: parseFloat(repeatRate),
      
      // Revenue analytics
      revenue_by_category: revenueByCategoryResult.rows,
      revenue_by_location: revenueByLocationResult.rows,
      
      // Extras statistics
      total_extras: parseInt(totalExtrasResult.rows[0].count),
      popular_extras: popularExtrasResult.rows,
      
      // Blog statistics
      total_blog_posts: parseInt(totalBlogPostsResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all bookings
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      vehicle_id, 
      date_from, 
      date_to,
      booking_number,
      customer_name,
      vehicle_search,
      page = '1',
      per_page = '20'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const perPageNum = parseInt(per_page as string) || 20;
    const offset = (pageNum - 1) * perPageNum;

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

    if (booking_number) {
      query += ` AND b.booking_number ILIKE $${paramCount}`;
      params.push(`%${booking_number}%`);
      paramCount++;
    }

    if (customer_name) {
      query += ` AND (c.first_name ILIKE $${paramCount} OR c.last_name ILIKE $${paramCount} OR CONCAT(c.first_name, ' ', c.last_name) ILIKE $${paramCount})`;
      params.push(`%${customer_name}%`);
      paramCount++;
    }

    if (vehicle_search) {
      query += ` AND (v.make ILIKE $${paramCount} OR v.model ILIKE $${paramCount} OR CONCAT(v.make, ' ', v.model) ILIKE $${paramCount})`;
      params.push(`%${vehicle_search}%`);
      paramCount++;
    }

    // Get total count for pagination
    const countQuery = query.replace(
      /SELECT b\.\*, [\s\S]*?FROM bookings b/,
      'SELECT COUNT(*) as total FROM bookings b'
    );
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].total);

    query += ` ORDER BY b.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(perPageNum, offset);

    const result = await pool.query(query, params);
    
    res.json({
      bookings: result.rows,
      pagination: {
        page: pageNum,
        per_page: perPageNum,
        total: totalCount,
        total_pages: Math.ceil(totalCount / perPageNum)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper to validate allowed booking status transitions and required fields
function validateBookingStatusChange(
  currentStatus: string,
  newStatus: string,
  notes?: string,
  payment_link?: string,
  currentPaymentLink?: string | null
) {
  const validStatuses = ['pending', 'waiting_payment', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(newStatus)) {
    return 'Invalid status';
  }

  const effectivePaymentLink = payment_link || currentPaymentLink || undefined;

  // Require payment link when moving into waiting_payment
  if (newStatus === 'waiting_payment' && !payment_link) {
    return 'Payment link is required when setting status to waiting_payment';
  }

  // Require payment link when moving into confirmed and no link exists yet
  if (newStatus === 'confirmed' && !effectivePaymentLink) {
    return 'Payment link is required when setting status to confirmed';
  }

  // Require cancellation note
  if (newStatus === 'cancelled' && (!notes || !notes.trim())) {
    return 'Cancellation note is required when cancelling a booking';
  }

  // Basic transition rules (mostly permissive so admin can correct mistakes)
  const allowedTransitions: Record<string, string[]> = {
    pending: ['waiting_payment', 'confirmed', 'cancelled'],
    waiting_payment: ['pending', 'confirmed', 'cancelled'],
    confirmed: ['waiting_payment', 'cancelled', 'completed'],
    completed: [], // completed is terminal in normal flow
    cancelled: [], // cancelled is terminal in normal flow
  };

  const allowedNext = allowedTransitions[currentStatus] || [];
  if (allowedNext.length > 0 && !allowedNext.includes(newStatus)) {
    return `Cannot change status from ${currentStatus} to ${newStatus}`;
  }

  return null;
}

// Helper to automatically sync vehicle subunit status based on booking status
async function syncVehicleSubunitStatus(booking: any) {
  try {
    const subunitId = booking.vehicle_subunit_id;
    if (!subunitId) return;

    // Get current subunit status
    const subunitResult = await pool.query(
      'SELECT id, status FROM vehicle_subunits WHERE id = $1',
      [subunitId]
    );
    if (subunitResult.rows.length === 0) return;

    const currentSubunit = subunitResult.rows[0];

    // If admin has explicitly set maintenance, don't override automatically
    if (currentSubunit.status === 'maintenance') {
      return;
    }

    const now = new Date();
    const pickupDate = new Date(booking.pickup_date);
    const dropoffDate = new Date(booking.dropoff_date);
    let newSubunitStatus: string | null = null;

    switch (booking.status) {
      case 'waiting_payment':
        // Vehicle is reserved for this customer
        newSubunitStatus = 'reserved';
        break;
      case 'confirmed':
        if (now >= pickupDate && now <= dropoffDate) {
          newSubunitStatus = 'out_on_rent';
        } else if (now < pickupDate) {
          newSubunitStatus = 'reserved';
        } else {
          // Past booking marked confirmed
          newSubunitStatus = 'returned';
        }
        break;
      case 'completed':
        newSubunitStatus = 'returned';
        break;
      case 'cancelled': {
        // On cancellation, check if there are other active/future bookings holding this subunit
        const activeStatuses = ['pending', 'waiting_payment', 'confirmed'];
        const futureBookingsResult = await pool.query(
          `SELECT 1
           FROM bookings
           WHERE vehicle_subunit_id = $1
           AND id != $2
           AND status = ANY($3)
           AND dropoff_date > NOW()
           LIMIT 1`,
          [subunitId, booking.id, activeStatuses]
        );

        if (futureBookingsResult.rows.length > 0) {
          newSubunitStatus = 'reserved';
        } else {
          newSubunitStatus = 'available';
        }
        break;
      }
      default:
        // For other statuses (e.g. pending), don't change automatically
        break;
    }

    if (!newSubunitStatus || newSubunitStatus === currentSubunit.status) {
      return;
    }

    await pool.query(
      'UPDATE vehicle_subunits SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newSubunitStatus, subunitId]
    );
  } catch (error) {
    console.error('Error syncing vehicle subunit status:', error);
    // Fail silently so booking update still succeeds
  }
}

// Update booking status
router.put('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status: newStatus, notes, payment_link } = req.body;

    if (!newStatus) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Load current booking for validation and later sync
    const currentResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const currentBooking = currentResult.rows[0];

    const validationError = validateBookingStatusChange(
      currentBooking.status,
      newStatus,
      notes,
      payment_link,
      currentBooking.payment_link || null
    );
    if (validationError) {
      console.error('[Admin] Booking status validation failed:', {
        bookingId: id,
        currentStatus: currentBooking.status,
        newStatus,
        hasNotes: notes !== undefined && notes !== null,
        hasPaymentLinkInRequest: payment_link !== undefined && payment_link !== null,
        hasExistingPaymentLink: !!currentBooking.payment_link,
        error: validationError
      });
      return res.status(400).json({ error: validationError });
    }

    const updateFields: string[] = ['status = $1'];
    const params: any[] = [newStatus];
    let paramCount = 2;

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }

    if (payment_link !== undefined) {
      updateFields.push(`payment_link = $${paramCount}`);
      params.push(payment_link);
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

    const updatedBooking = result.rows[0];

    // Check if payment link was newly added
    // Use the updated booking's payment_link value (which may come from request or remain unchanged)
    const hadPaymentLink = currentBooking.payment_link && currentBooking.payment_link.trim() !== '';
    const hasPaymentLink = updatedBooking.payment_link && updatedBooking.payment_link.trim() !== '';
    const paymentLinkAdded = !hadPaymentLink && hasPaymentLink;

    // Handle coupon usage tracking based on status changes
    if (currentBooking.coupon_code) {
      // Status changed from non-confirmed to confirmed - increment usage
      if (currentBooking.status !== 'confirmed' && newStatus === 'confirmed') {
        await pool.query(
          'UPDATE coupons SET usage_count = usage_count + 1 WHERE code = $1',
          [currentBooking.coupon_code.toUpperCase()]
        );
      }
      // Status changed from confirmed to cancelled - decrement usage
      else if (currentBooking.status === 'confirmed' && newStatus === 'cancelled') {
        await pool.query(
          'UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE code = $1',
          [currentBooking.coupon_code.toUpperCase()]
        );
      }
    }

    // Sync vehicle subunit status based on updated booking status
    await syncVehicleSubunitStatus(updatedBooking);

    // Fetch full booking details with customer, vehicle, and location info for email
    const fullBookingResult = await pool.query(
      `SELECT 
       b.id, b.booking_number, b.status, b.pickup_date, b.dropoff_date,
       b.total_price, b.base_price, b.extras_price, b.discount_amount,
       b.payment_link, b.notes,
       c.first_name, c.last_name, c.email, c.phone,
       v.make, v.model, v.year,
       pl.name as pickup_location_name, pl.city as pickup_location_city,
       dl.name as dropoff_location_name, dl.city as dropoff_location_city
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN locations pl ON b.pickup_location_id = pl.id
       JOIN locations dl ON b.dropoff_location_id = dl.id
       WHERE b.id = $1`,
      [updatedBooking.id]
    );

    const fullBooking = fullBookingResult.rows[0];

    // Send status update email (fire-and-forget, don't block the response)
    // Always send email when:
    // 1. Status changes, OR
    // 2. Payment link is newly added, OR
    // 3. Payment link is provided and status is set to waiting_payment/confirmed (even if link existed before)
    const hasPaymentLinkInRequest = payment_link !== undefined && payment_link && payment_link.trim() !== '';
    const statusRequiresPaymentEmail = (newStatus === 'waiting_payment' || newStatus === 'confirmed') && hasPaymentLinkInRequest;
    const shouldSendEmail = currentBooking.status !== newStatus || paymentLinkAdded || statusRequiresPaymentEmail;
    
    if (shouldSendEmail) {
      console.log('[Admin] Attempting to send booking status email for:', {
        booking_number: fullBooking.booking_number,
        status: fullBooking.status,
        email: fullBooking.email,
        has_payment_link: !!fullBooking.payment_link,
        payment_link: fullBooking.payment_link ? '***provided***' : 'none',
        payment_link_added: paymentLinkAdded,
        status_changed: currentBooking.status !== newStatus,
        status_requires_payment_email: statusRequiresPaymentEmail,
        reason: statusRequiresPaymentEmail 
          ? 'Status requires payment email' 
          : paymentLinkAdded 
            ? 'Payment link added' 
            : 'Status changed',
        has_base_price: fullBooking.base_price !== undefined,
        has_extras_price: fullBooking.extras_price !== undefined,
        has_discount_amount: fullBooking.discount_amount !== undefined,
      });
      
      // Convert numeric fields to numbers (PostgreSQL returns them as strings)
      const emailBookingData = {
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
        status: fullBooking.status,
        payment_link: fullBooking.payment_link,
        notes: fullBooking.notes,
        pickup_location_city: fullBooking.pickup_location_city,
        dropoff_location_city: fullBooking.dropoff_location_city,
      };
      
      // Always send email when payment link is added, regardless of status
      sendBookingStatusEmail(emailBookingData)
        .then(() => {
          console.log('[Admin] Booking status email sent successfully for:', fullBooking.booking_number);
        })
        .catch((emailError) => {
          console.error('[Admin] Failed to send booking status email:', emailError);
          console.error('[Admin] Email error details:', {
            message: emailError.message,
            response: emailError.response?.data,
            status: emailError.response?.status,
            stack: emailError.stack,
          });
        });
    } else {
      console.log('[Admin] Skipping email send - no status change and no payment link added');
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit booking (dates and extras)
router.put('/bookings/:id/edit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pickup_date, dropoff_date, extras } = req.body;

    // Load current booking
    const currentResult = await pool.query(
      `SELECT b.*, v.base_price_daily 
       FROM bookings b 
       JOIN vehicles v ON b.vehicle_id = v.id 
       WHERE b.id = $1`,
      [id]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const currentBooking = currentResult.rows[0];

    // Validate that booking is editable
    if (!['pending', 'waiting_payment', 'confirmed'].includes(currentBooking.status)) {
      return res.status(400).json({ error: 'Cannot edit completed or cancelled bookings' });
    }

    const newPickupDate = pickup_date ? new Date(pickup_date) : new Date(currentBooking.pickup_date);
    const newDropoffDate = dropoff_date ? new Date(dropoff_date) : new Date(currentBooking.dropoff_date);

    // Validate dates
    if (newPickupDate >= newDropoffDate) {
      return res.status(400).json({ error: 'Drop-off date must be after pick-up date' });
    }

    // Check vehicle availability for new dates (if dates changed)
    if (pickup_date || dropoff_date) {
      const conflictingBookings = await pool.query(
        `SELECT id FROM bookings 
         WHERE vehicle_subunit_id = $1 
         AND id != $2
         AND status IN ('pending', 'waiting_payment', 'confirmed')
         AND (
           (pickup_date <= $3 AND dropoff_date > $3) OR
           (pickup_date < $4 AND dropoff_date >= $4) OR
           (pickup_date >= $3 AND dropoff_date <= $4)
         )`,
        [currentBooking.vehicle_subunit_id, id, newPickupDate, newDropoffDate]
      );

      if (conflictingBookings.rows.length > 0) {
        return res.status(400).json({ error: 'Vehicle is not available for the selected dates' });
      }
    }

    // Calculate new rental days
    const days = Math.ceil((newDropoffDate.getTime() - newPickupDate.getTime()) / (1000 * 60 * 60 * 24));
    const basePrice = currentBooking.base_price_daily * days;

    // Calculate extras price
    let extrasPrice = 0;
    if (extras && Array.isArray(extras)) {
      const extrasResult = await pool.query(
        `SELECT id, price, price_type FROM extras WHERE id = ANY($1::uuid[])`,
        [extras.map((e: any) => e.id)]
      );

      extras.forEach((extra: any) => {
        const extraData = extrasResult.rows.find((e) => e.id === extra.id);
        if (extraData) {
          if (extraData.price_type === 'per_day') {
            extrasPrice += extraData.price * days * (extra.quantity || 1);
          } else {
            extrasPrice += extraData.price * (extra.quantity || 1);
          }
        }
      });

      // Update booking extras
      await pool.query('DELETE FROM booking_extras WHERE booking_id = $1', [id]);
      
      for (const extra of extras) {
        const extraDataResult = await pool.query(
          'SELECT price FROM extras WHERE id = $1',
          [extra.id]
        );
        if (extraDataResult.rows.length > 0) {
          await pool.query(
            `INSERT INTO booking_extras (booking_id, extra_id, quantity, price)
             VALUES ($1, $2, $3, $4)`,
            [id, extra.id, extra.quantity || 1, extraDataResult.rows[0].price]
          );
        }
      }
    } else {
      extrasPrice = parseFloat(currentBooking.extras_price) || 0;
    }

    // Recalculate total with existing discount
    const discountAmount = parseFloat(currentBooking.discount_amount) || 0;
    const totalPrice = basePrice + extrasPrice - discountAmount;

    // Update booking
    const updateFields = [];
    const params: any[] = [];
    let paramCount = 1;

    if (pickup_date) {
      updateFields.push(`pickup_date = $${paramCount}`);
      params.push(newPickupDate);
      paramCount++;
    }

    if (dropoff_date) {
      updateFields.push(`dropoff_date = $${paramCount}`);
      params.push(newDropoffDate);
      paramCount++;
    }

    updateFields.push(`base_price = $${paramCount}`);
    params.push(basePrice);
    paramCount++;

    updateFields.push(`extras_price = $${paramCount}`);
    params.push(extrasPrice);
    paramCount++;

    updateFields.push(`total_price = $${paramCount}`);
    params.push(totalPrice);
    paramCount++;

    params.push(id);

    const result = await pool.query(
      `UPDATE bookings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} RETURNING *`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error editing booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all vehicles (admin)
router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT v.*, 
       COUNT(DISTINCT vs.id) as subunit_count,
       COUNT(DISTINCT CASE WHEN vs.status = 'available' THEN vs.id END) as available_count,
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
       WHERE vehicle_id = $1 AND status IN ('confirmed', 'active', 'pending', 'waiting_payment')`,
      [id]
    );

    if (parseInt(bookingsResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete vehicle with active or pending bookings. Deactivate it instead.',
      });
    }

    // Check if vehicle has any bookings (even past ones)
    const allBookingsResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings WHERE vehicle_id = $1`,
      [id]
    );

    if (parseInt(allBookingsResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete vehicle with booking history. Deactivate it instead.',
      });
    }

    // Delete related records in the correct order
    // 1. Delete vehicle_extras associations
    await pool.query('DELETE FROM vehicle_extras WHERE vehicle_id = $1', [id]);

    // 2. Delete availability notes
    await pool.query('DELETE FROM availability_notes WHERE vehicle_id = $1', [id]);

    // 3. Delete damage logs for this vehicle's subunits
    await pool.query(
      `DELETE FROM damage_logs WHERE vehicle_subunit_id IN 
       (SELECT id FROM vehicle_subunits WHERE vehicle_id = $1)`,
      [id]
    );

    // 4. Delete availability notes for this vehicle's subunits
    await pool.query(
      `DELETE FROM availability_notes WHERE vehicle_subunit_id IN 
       (SELECT id FROM vehicle_subunits WHERE vehicle_id = $1)`,
      [id]
    );

    // 5. Delete vehicle_subunits
    await pool.query('DELETE FROM vehicle_subunits WHERE vehicle_id = $1', [id]);

    // 6. Finally, delete the vehicle
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
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

// Availability overview - Get vehicles with subunits and bookings
router.get('/availability', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, month, year, page = '1', per_page = '100' } = req.query;

    const startDate = new Date(
      parseInt(year as string) || new Date().getFullYear(),
      (parseInt(month as string) || new Date().getMonth()) - 1,
      1
    );
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const pageNum = parseInt(page as string) || 1;
    const perPageNum = Math.min(parseInt(per_page as string) || 100, 500); // Limit to 500
    const offset = (pageNum - 1) * perPageNum;

    // Get vehicles with subunits
    let vehicleQuery = `
      SELECT 
        v.id,
        v.make,
        v.model,
        v.year,
        COUNT(DISTINCT vs.id) as total_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'available' THEN vs.id END) as available_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'reserved' THEN vs.id END) as reserved_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'out_on_rent' THEN vs.id END) as out_on_rent_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'returned' THEN vs.id END) as returned_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'maintenance' THEN vs.id END) as maintenance_subunits
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

    vehicleQuery += ` GROUP BY v.id, v.make, v.model, v.year ORDER BY v.make, v.model LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    vehicleParams.push(perPageNum, offset);
    paramCount += 2;

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
      pagination: {
        page: pageNum,
        per_page: perPageNum,
        total: vehiclesResult.rows.length,
      },
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get availability conflicts
router.get('/availability/conflicts', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const startDate = new Date(start_date as string);
    const endDate = new Date(end_date as string);

    let query = `
      SELECT 
        b1.id as booking1_id,
        b1.booking_number as booking1_number,
        b1.vehicle_subunit_id,
        b1.pickup_date as booking1_pickup,
        b1.dropoff_date as booking1_dropoff,
        b1.status as booking1_status,
        b2.id as booking2_id,
        b2.booking_number as booking2_number,
        b2.pickup_date as booking2_pickup,
        b2.dropoff_date as booking2_dropoff,
        b2.status as booking2_status,
        vs.license_plate,
        v.make,
        v.model
      FROM bookings b1
      JOIN bookings b2 ON b1.vehicle_subunit_id = b2.vehicle_subunit_id
      JOIN vehicle_subunits vs ON b1.vehicle_subunit_id = vs.id
      JOIN vehicles v ON vs.vehicle_id = v.id
      WHERE b1.id != b2.id
      AND b1.status = ANY($1::text[])
      AND b2.status = ANY($1::text[])
      AND (
        (b1.pickup_date <= b2.dropoff_date AND b1.dropoff_date >= b2.pickup_date)
      )
      AND (
        (b1.pickup_date >= $2 AND b1.pickup_date <= $3)
        OR (b2.pickup_date >= $2 AND b2.pickup_date <= $3)
      )
    `;

    const params: any[] = [['pending', 'waiting_payment', 'confirmed', 'active'], startDate, endDate];
    let paramCount = 4;

    if (vehicle_id) {
      query += ` AND v.id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }

    query += ` ORDER BY b1.pickup_date, b2.pickup_date`;

    const result = await pool.query(query, params);

    res.json({
      conflicts: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching availability conflicts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export availability data
router.get('/availability/export', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, start_date, end_date, format = 'json' } = req.query;

    const startDate = start_date ? new Date(start_date as string) : new Date();
    const endDate = end_date ? new Date(end_date as string) : new Date();
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
        COUNT(DISTINCT CASE WHEN vs.status = 'reserved' THEN vs.id END) as reserved_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'out_on_rent' THEN vs.id END) as out_on_rent_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'returned' THEN vs.id END) as returned_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'maintenance' THEN vs.id END) as maintenance_subunits
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

    // Get bookings
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
        c.first_name || ' ' || c.last_name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
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
        vs.license_plate,
        v.make,
        v.model
      FROM availability_notes an
      LEFT JOIN vehicle_subunits vs ON an.vehicle_subunit_id = vs.id
      LEFT JOIN vehicles v ON (an.vehicle_id = v.id OR vs.vehicle_id = v.id)
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

    const exportData = {
      export_date: new Date().toISOString(),
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      vehicles: vehiclesResult.rows,
      bookings: bookingsResult.rows,
      availability_notes: notesResult.rows,
      summary: {
        total_vehicles: vehiclesResult.rows.length,
        total_bookings: bookingsResult.rows.length,
        total_notes: notesResult.rows.length,
        total_subunits: vehiclesResult.rows.reduce((sum, v) => sum + parseInt(v.total_subunits || 0), 0),
        available_subunits: vehiclesResult.rows.reduce((sum, v) => sum + parseInt(v.available_subunits || 0), 0),
      },
    };

    if (format === 'csv') {
      // Generate CSV
      const csvRows: string[] = [];
      
      // Vehicles CSV
      csvRows.push('=== VEHICLES ===');
      csvRows.push('Make,Model,Year,Total Subunits,Available,Reserved,Out on Rent,Returned,Maintenance');
      vehiclesResult.rows.forEach((v) => {
        csvRows.push(
          `"${v.make || ''}","${v.model || ''}",${v.year || ''},${v.total_subunits || 0},${v.available_subunits || 0},${v.reserved_subunits || 0},${v.out_on_rent_subunits || 0},${v.returned_subunits || 0},${v.maintenance_subunits || 0}`
        );
      });
      
      csvRows.push('\n=== BOOKINGS ===');
      csvRows.push('Booking Number,Vehicle,License Plate,Pickup Date,Dropoff Date,Status,Customer Name,Customer Email,Customer Phone');
      bookingsResult.rows.forEach((b) => {
        csvRows.push(
          `"${b.booking_number || ''}","${b.make || ''} ${b.model || ''}","${b.license_plate || ''}","${b.pickup_date}","${b.dropoff_date}","${b.booking_status || ''}","${b.customer_name || ''}","${b.customer_email || ''}","${b.customer_phone || ''}"`
        );
      });
      
      csvRows.push('\n=== AVAILABILITY NOTES ===');
      csvRows.push('Date,Type,Note,Vehicle,License Plate');
      notesResult.rows.forEach((n) => {
        csvRows.push(
          `"${n.note_date}","${n.note_type || ''}","${(n.note || '').replace(/"/g, '""')}","${n.make || ''} ${n.model || ''}","${n.license_plate || ''}"`
        );
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=availability-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvRows.join('\n'));
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=availability-export-${new Date().toISOString().split('T')[0]}.json`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get availability analytics
router.get('/availability/analytics', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, start_date, end_date } = req.query;

    const startDate = start_date ? new Date(start_date as string) : new Date();
    startDate.setMonth(startDate.getMonth() - 1); // Default to last month
    const endDate = end_date ? new Date(end_date as string) : new Date();

    // Get utilization stats
    let utilizationQuery = `
      SELECT 
        DATE(b.pickup_date) as date,
        COUNT(DISTINCT b.id) as booking_count,
        COUNT(DISTINCT vs.vehicle_id) as vehicles_used,
        COUNT(DISTINCT vs.id) as subunits_used
      FROM bookings b
      JOIN vehicle_subunits vs ON b.vehicle_subunit_id = vs.id
      WHERE b.status IN ('confirmed', 'active', 'completed')
      AND b.pickup_date >= $1
      AND b.pickup_date <= $2
    `;
    const utilParams: any[] = [startDate, endDate];
    let utilParamCount = 3;

    if (vehicle_id) {
      utilizationQuery += ` AND vs.vehicle_id = $${utilParamCount}`;
      utilParams.push(vehicle_id);
      utilParamCount++;
    }

    utilizationQuery += ` GROUP BY DATE(b.pickup_date) ORDER BY date`;

    const utilizationResult = await pool.query(utilizationQuery, utilParams);

    // Get availability stats
    let availabilityQuery = `
      SELECT 
        COUNT(DISTINCT vs.id) as total_subunits,
        COUNT(DISTINCT CASE WHEN vs.status = 'available' THEN vs.id END) as available_count,
        COUNT(DISTINCT CASE WHEN vs.status = 'reserved' THEN vs.id END) as reserved_count,
        COUNT(DISTINCT CASE WHEN vs.status = 'out_on_rent' THEN vs.id END) as out_on_rent_count,
        COUNT(DISTINCT CASE WHEN vs.status = 'maintenance' THEN vs.id END) as maintenance_count
      FROM vehicle_subunits vs
      JOIN vehicles v ON vs.vehicle_id = v.id
      WHERE 1=1
    `;
    const availParams: any[] = [];
    let availParamCount = 1;

    if (vehicle_id) {
      availabilityQuery += ` AND v.id = $${availParamCount}`;
      availParams.push(vehicle_id);
      availParamCount++;
    }

    const availabilityResult = await pool.query(availabilityQuery, availParams);

    const totalSubunits = parseInt(availabilityResult.rows[0].total_subunits || 0);
    const availableCount = parseInt(availabilityResult.rows[0].available_count || 0);
    const utilizationRate = totalSubunits > 0 
      ? ((totalSubunits - availableCount) / totalSubunits * 100).toFixed(2)
      : 0;

    res.json({
      utilization: utilizationResult.rows,
      availability: availabilityResult.rows[0],
      utilization_rate: typeof utilizationRate === 'number' ? utilizationRate : parseFloat(utilizationRate),
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching availability analytics:', error);
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

    if (!['available', 'reserved', 'out_on_rent', 'returned', 'maintenance'].includes(status)) {
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

// Bulk update vehicle subunit statuses
router.post('/vehicle-subunits/bulk-status', async (req: Request, res: Response) => {
  try {
    const { subunit_ids, status } = req.body;

    if (!Array.isArray(subunit_ids) || subunit_ids.length === 0) {
      return res.status(400).json({ error: 'subunit_ids must be a non-empty array' });
    }

    if (!['available', 'reserved', 'out_on_rent', 'returned', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE vehicle_subunits 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ANY($2::uuid[])
       RETURNING *`,
      [status, subunit_ids]
    );

    res.json({
      updated_count: result.rows.length,
      subunits: result.rows,
    });
  } catch (error) {
    console.error('Error bulk updating subunit statuses:', error);
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

      // Check for existing bookings on this date if blocking/maintenance
      if (note_type === 'blocked' || note_type === 'maintenance') {
        const noteDate = new Date(note_date);
        const startDate = new Date(noteDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(noteDate);
        endDate.setHours(23, 59, 59, 999);

        let bookingCheckQuery = `
          SELECT COUNT(*) as count
          FROM bookings b
          JOIN vehicle_subunits vs ON b.vehicle_subunit_id = vs.id
          WHERE b.status = ANY($1::text[])
          AND (b.pickup_date <= $3 AND b.dropoff_date >= $2)
        `;
        const bookingParams: any[] = [['pending', 'waiting_payment', 'confirmed', 'active'], startDate, endDate];
        let paramCount = 4;

        if (vehicle_id) {
          bookingCheckQuery += ` AND vs.vehicle_id = $${paramCount}`;
          bookingParams.push(vehicle_id);
          paramCount++;
        } else if (vehicle_subunit_id) {
          bookingCheckQuery += ` AND vs.id = $${paramCount}`;
          bookingParams.push(vehicle_subunit_id);
          paramCount++;
        }

        const bookingCheckResult = await pool.query(bookingCheckQuery, bookingParams);
        const bookingCount = parseInt(bookingCheckResult.rows[0].count);

        if (bookingCount > 0) {
          return res.status(400).json({
            error: `Cannot create ${note_type} note: ${bookingCount} active booking(s) exist on this date`,
            warning: true,
            booking_count: bookingCount,
          });
        }
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

// Update availability note
router.put(
  '/availability-notes/:id',
  [
    body('note_date').optional().isISO8601().toDate(),
    body('note').optional().notEmpty(),
    body('note_type').optional().isIn(['maintenance', 'blocked', 'special']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { note_date, note, note_type } = req.body;

      // Check if note exists
      const existingResult = await pool.query(
        'SELECT * FROM availability_notes WHERE id = $1',
        [id]
      );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Availability note not found' });
      }

      const existingNote = existingResult.rows[0];

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (note_date !== undefined) {
        updates.push(`note_date = $${paramCount}`);
        values.push(note_date);
        paramCount++;
      }

      if (note !== undefined) {
        updates.push(`note = $${paramCount}`);
        values.push(note);
        paramCount++;
      }

      if (note_type !== undefined) {
        updates.push(`note_type = $${paramCount}`);
        values.push(note_type);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await pool.query(
        `UPDATE availability_notes 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating availability note:', error);
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

      // Update subunit status if needed - use maintenance instead of a dedicated damaged status
      if (repair_cost) {
        await pool.query(
          'UPDATE vehicle_subunits SET status = $1 WHERE id = $2',
          ['maintenance', vehicle_subunit_id]
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

// Quick customer search for autocomplete (optimized for speed)
router.get('/customers/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.json([]);
    }
    
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, 
              date_of_birth, license_number, license_country, license_expiry, 
              address, city, country
       FROM customers 
       WHERE LOWER(first_name || ' ' || last_name) LIKE LOWER($1) 
          OR LOWER(email) LIKE LOWER($1)
          OR phone LIKE $1
       ORDER BY created_at DESC 
       LIMIT 10`,
      [`%${q}%`]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
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

// Get all coupons (admin - includes inactive and expired)
router.get('/coupons', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get coupon by ID
router.get('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create coupon
router.post(
  '/coupons',
  [
    body('code').notEmpty().trim(),
    body('discount_type').isIn(['percentage', 'fixed_amount']),
    body('discount_value').isFloat({ min: 0 }),
    body('valid_from').isISO8601().toDate(),
    body('valid_until').isISO8601().toDate(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        code,
        description,
        discount_type,
        discount_value,
        minimum_rental_days,
        minimum_amount,
        valid_from,
        valid_until,
        usage_limit,
        is_active,
      } = req.body;

      // Auto-uppercase and remove spaces from code
      const normalizedCode = code.toUpperCase().replace(/\s+/g, '');

      // Validate discount value
      if (discount_value <= 0) {
        return res.status(400).json({ error: 'Discount value must be greater than 0' });
      }

      // Validate dates
      if (new Date(valid_from) >= new Date(valid_until)) {
        return res.status(400).json({ error: 'Valid from date must be before valid until date' });
      }

      // Check for duplicate code
      const existingCoupon = await pool.query(
        'SELECT id FROM coupons WHERE code = $1',
        [normalizedCode]
      );

      if (existingCoupon.rows.length > 0) {
        return res.status(400).json({ error: 'Coupon code already exists' });
      }

      const result = await pool.query(
        `INSERT INTO coupons 
         (code, description, discount_type, discount_value, minimum_rental_days, 
          minimum_amount, valid_from, valid_until, usage_limit, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          normalizedCode,
          description || null,
          discount_type,
          discount_value,
          minimum_rental_days || null,
          minimum_amount || null,
          valid_from,
          valid_until,
          usage_limit || null,
          is_active !== undefined ? is_active : true,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating coupon:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update coupon
router.put(
  '/coupons/:id',
  [
    body('code').optional().notEmpty().trim(),
    body('discount_type').optional().isIn(['percentage', 'fixed_amount']),
    body('discount_value').optional().isFloat({ min: 0 }),
    body('valid_from').optional().isISO8601().toDate(),
    body('valid_until').optional().isISO8601().toDate(),
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

      const allowedFields = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'minimum_rental_days',
        'minimum_amount',
        'valid_from',
        'valid_until',
        'usage_limit',
        'is_active',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          let value = req.body[field];

          // Auto-uppercase and remove spaces from code
          if (field === 'code') {
            value = value.toUpperCase().replace(/\s+/g, '');

            // Check for duplicate code (excluding current coupon)
            const existingCoupon = await pool.query(
              'SELECT id FROM coupons WHERE code = $1 AND id != $2',
              [value, id]
            );

            if (existingCoupon.rows.length > 0) {
              return res.status(400).json({ error: 'Coupon code already exists' });
            }
          }

          updateFields.push(`${field} = $${paramCount}`);
          params.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Validate dates if both are being updated
      if (req.body.valid_from && req.body.valid_until) {
        if (new Date(req.body.valid_from) >= new Date(req.body.valid_until)) {
          return res.status(400).json({ error: 'Valid from date must be before valid until date' });
        }
      }

      params.push(id);

      const result = await pool.query(
        `UPDATE coupons SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating coupon:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Toggle coupon active status
router.put('/coupons/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current status
    const currentResult = await pool.query(
      'SELECT is_active FROM coupons WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    const newStatus = !currentResult.rows[0].is_active;

    const result = await pool.query(
      'UPDATE coupons SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newStatus, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete coupon
router.delete('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if coupon has been used
    const couponResult = await pool.query(
      'SELECT usage_count FROM coupons WHERE id = $1',
      [id]
    );

    if (couponResult.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    const usageCount = parseInt(couponResult.rows[0].usage_count) || 0;

    if (usageCount > 0) {
      return res.status(400).json({
        error: `Cannot delete coupon that has been used ${usageCount} time(s). Deactivate it instead.`,
      });
    }

    const result = await pool.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all locations (admin - includes inactive)
router.get('/locations', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM locations ORDER BY city, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get location by ID
router.get('/locations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create location
router.post(
  '/locations',
  [
    body('name').notEmpty().trim(),
    body('address').notEmpty().trim(),
    body('city').notEmpty().trim(),
    body('email').optional().isEmail(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        address,
        city,
        country,
        phone,
        email,
        latitude,
        longitude,
        is_active,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO locations 
         (name, address, city, country, phone, email, latitude, longitude, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          name,
          address,
          city,
          country || 'Morocco',
          phone || null,
          email || null,
          latitude || null,
          longitude || null,
          is_active !== undefined ? is_active : true,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update location
router.put(
  '/locations/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('address').optional().notEmpty().trim(),
    body('city').optional().notEmpty().trim(),
    body('email').optional().isEmail(),
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

      const allowedFields = [
        'name',
        'address',
        'city',
        'country',
        'phone',
        'email',
        'latitude',
        'longitude',
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
        `UPDATE locations SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramCount} RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Toggle location active status
router.put('/locations/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current status
    const currentResult = await pool.query(
      'SELECT is_active FROM locations WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const currentStatus = currentResult.rows[0].is_active;
    const newStatus = !currentStatus;

    // If trying to deactivate, check for active bookings
    if (currentStatus === true && newStatus === false) {
      const activeBookingsResult = await pool.query(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE (pickup_location_id = $1 OR dropoff_location_id = $1)
         AND status IN ('pending', 'waiting_payment', 'confirmed', 'active')`,
        [id]
      );

      const activeBookingsCount = parseInt(activeBookingsResult.rows[0].count);

      if (activeBookingsCount > 0) {
        return res.status(400).json({
          error: `Cannot deactivate location with ${activeBookingsCount} active booking(s)`,
        });
      }
    }

    const result = await pool.query(
      'UPDATE locations SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newStatus, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling location status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete location
router.delete('/locations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if location has any bookings
    const bookingsResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE pickup_location_id = $1 OR dropoff_location_id = $1`,
      [id]
    );

    const bookingsCount = parseInt(bookingsResult.rows[0].count);

    if (bookingsCount > 0) {
      return res.status(400).json({
        error: `Cannot delete location with ${bookingsCount} booking(s). Mark it as inactive instead.`,
      });
    }

    const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

