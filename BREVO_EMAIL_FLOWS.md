# Brevo Email Integration - Complete Flow Documentation

This document confirms **every flow** where emails are sent to Brevo in the application.

## Email Service Functions

The application has **3 main email functions** in `backend/src/services/email.ts`:

1. `sendBookingEmail()` - Sends booking confirmation emails
2. `sendBookingStatusEmail()` - Sends booking status update emails
3. `sendContactEmail()` - Sends contact form emails

---

## Flow 1: New Booking Created ✅

**Route:** `POST /api/bookings`  
**File:** `backend/src/routes/bookings.ts` (lines 302-321)

### Trigger:
- When a customer submits a booking form from the frontend
- Booking is successfully created in the database

### Emails Sent:
1. **Customer Confirmation Email** (always sent)
   - Recipient: Customer's email address
   - Subject: `Your Booking Confirmation - {booking_number}`
   - Content: Booking details, vehicle info, pickup/dropoff locations and dates, total price

2. **Admin Notification Email** (sent if `BREVO_ADMIN_EMAIL` is configured)
   - Recipient: Admin email from `BREVO_ADMIN_EMAIL` env variable
   - Subject: `New Booking Received - {booking_number}`
   - Content: Same as customer email + customer phone number

### Code Reference:
```302:321:backend/src/routes/bookings.ts
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
```

### Behavior:
- **Non-blocking**: Email failure does not prevent booking creation
- **Fire-and-forget**: Email is sent asynchronously

---

## Flow 2: Booking Status Updated ✅

**Route:** `PUT /api/admin/bookings/:id`  
**File:** `backend/src/routes/admin.ts` (lines 555-712)

### Trigger:
An admin updates a booking status in the admin panel. Email is sent when **ANY** of these conditions are met:

1. **Status changes** (e.g., `pending` → `confirmed`)
2. **Payment link is newly added** (was empty, now has value)
3. **Payment link is provided** AND status is `waiting_payment` or `confirmed` (even if link existed before)

### Emails Sent:
1. **Customer Status Update Email** (always sent when conditions are met)
   - Recipient: Customer's email address
   - Subject: Status-specific (e.g., `Payment Required - {booking_number}`, `Booking Confirmed - {booking_number}`)
   - Content: 
     - Status-specific message and color coding
     - Payment link (if provided) - prominently displayed
     - Admin notes (if provided)
     - Full booking details table

2. **Admin Notification Email** (sent if `BREVO_ADMIN_EMAIL` is configured)
   - Recipient: Admin email from `BREVO_ADMIN_EMAIL` env variable
   - Subject: `Booking Status Changed - {booking_number} ({status})`
   - Content: Status update details, payment link, notes, and booking information

### Status-Specific Email Content:
- **Pending** (Orange): "Booking under review"
- **Waiting Payment** (Blue): "Payment link available" (with prominent payment button)
- **Confirmed** (Green): "Booking confirmed"
- **Cancelled** (Red): "Booking cancelled"
- **Completed** (Purple): "Thank you message"

### Code Reference:
```660:705:backend/src/routes/admin.ts
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
      
      // Always send email when payment link is added, regardless of status
      sendBookingStatusEmail(fullBooking)
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
```

### Behavior:
- **Non-blocking**: Email failure does not prevent status update
- **Conditional**: Only sends when status changes or payment link is added
- **Error handling**: Errors are logged but don't affect the API response

---

## Flow 3: Contact Form Submission ✅

**Route:** `POST /api/contact`  
**File:** `backend/src/routes/contact.ts` (lines 8-47)

### Trigger:
- When a user submits the contact form from the frontend
- Form validation passes (name, email, message with min 10 characters)

### Emails Sent:
1. **Admin Notification Email** (sent if `BREVO_ADMIN_EMAIL` is configured)
   - Recipient: Admin email from `BREVO_ADMIN_EMAIL` env variable
   - Subject: `New Contact Form Submission from {name}`
   - Content: 
     - Customer name and email
     - Full message content
     - Reply button linking to customer email

2. **Customer Confirmation Email** (always sent)
   - Recipient: Customer's email address
   - Subject: `Thank You for Contacting DB Luxury Cars`
   - Content: 
     - Thank you message
     - Copy of their submitted message
     - Response time expectation (24 hours)

### Code Reference:
```27:33:backend/src/routes/contact.ts
      // Send email notification
      try {
        await sendContactEmail({ name, email, message });
      } catch (emailError) {
        console.error('Failed to send contact email:', emailError);
        // Don't fail the request if email fails, just log it
      }
```

### Behavior:
- **Non-blocking**: Email failure does not prevent form submission
- **Always sends**: Both admin and customer emails are sent (if admin email is configured)

---

## Email Configuration Requirements

All email functions require these environment variables in `backend/.env`:

### Required:
- `BREVO_API_KEY` - Your Brevo API key
- `BREVO_SENDER_EMAIL` - Verified sender email address in Brevo

### Optional:
- `BREVO_SENDER_NAME` - Display name (defaults to "DB Luxury Cars")
- `BREVO_ADMIN_EMAIL` - Admin email for notifications (if not set, admin emails are skipped)

---

## Email Sending Behavior Summary

| Flow | Customer Email | Admin Email | Blocking | Conditions |
|------|---------------|-------------|----------|------------|
| **New Booking** | ✅ Always | ✅ If configured | ❌ No | Booking created successfully |
| **Status Update** | ✅ Conditional | ✅ If configured | ❌ No | Status changed OR payment link added |
| **Contact Form** | ✅ Always | ✅ If configured | ❌ No | Form validation passes |

---

## Brevo API Endpoint

All emails are sent to:
```
POST https://api.brevo.com/v3/smtp/email
```

With headers:
- `api-key`: Your Brevo API key
- `Content-Type`: `application/json`
- `accept`: `application/json`

---

## Error Handling

All email functions:
- Log errors to console with `[Brevo]` prefix
- Do NOT block the main API response
- Use try-catch or `.catch()` for error handling
- Continue execution even if email fails

---

## Testing Checklist

To verify all email flows work:

1. ✅ **New Booking Flow**
   - Create a booking from frontend
   - Check customer email inbox
   - Check admin email inbox (if configured)

2. ✅ **Status Update Flow**
   - Update booking status in admin panel
   - Add payment link
   - Check customer email inbox
   - Check admin email inbox (if configured)

3. ✅ **Contact Form Flow**
   - Submit contact form from frontend
   - Check customer email inbox
   - Check admin email inbox (if configured)

---

## Summary

**Total Email Flows: 3**
- ✅ New Booking Creation
- ✅ Booking Status Update
- ✅ Contact Form Submission

**Total Email Functions: 3**
- ✅ `sendBookingEmail()`
- ✅ `sendBookingStatusEmail()`
- ✅ `sendContactEmail()`

**Total API Routes Triggering Emails: 3**
- ✅ `POST /api/bookings`
- ✅ `PUT /api/admin/bookings/:id`
- ✅ `POST /api/contact`

All flows are confirmed and documented above.

