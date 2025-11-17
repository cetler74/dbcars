# Brevo Email Integration Setup

## Overview
The booking system now sends emails via Brevo API in two scenarios:
1. **When a new booking is created** (from the frontend booking form)
2. **When an admin changes a booking status** (in the admin panel)

## Backend Changes

### Files Modified
- `backend/package.json` - Added `axios@^1.7.9` dependency
- `backend/src/services/email.ts` - Added email service with two functions:
  - `sendBookingEmail()` - Sends confirmation when booking is created
  - `sendBookingStatusEmail()` - Sends status update emails
- `backend/src/routes/bookings.ts` - Integrated email on booking creation
- `backend/src/routes/admin.ts` - Integrated email on status updates

### Required Environment Variables

Add these to your `backend/.env` file:

```bash
# Brevo API Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@dbluxcars.com
BREVO_SENDER_NAME=DB Luxury Cars
BREVO_ADMIN_EMAIL=admin@dbluxcars.com  # Optional: receives notifications
```

### How to Get Your Brevo API Key
1. Go to https://app.brevo.com
2. Navigate to Settings → SMTP & API
3. Create a new API key
4. Copy and paste it into your `.env` file

## Email Features

### New Booking Email (Customer)
Sent when: User clicks "Confirm Booking" button
Includes:
- Booking confirmation
- Booking number
- Vehicle details
- Pickup/dropoff locations and dates
- Total price

### Status Update Emails (Customer)
Sent when: Admin changes booking status
Includes:
- Status-specific message and color coding:
  - **Pending** (Orange): Booking under review
  - **Waiting Payment** (Blue): Payment link included
  - **Confirmed** (Green): Booking confirmed
  - **Cancelled** (Red): Booking cancelled
  - **Completed** (Purple): Thank you message
- Payment link (if provided by admin)
- Admin notes (if provided)
- Full booking details

### Admin Notification Emails
Both new bookings and status updates send a notification to `BREVO_ADMIN_EMAIL` with:
- Customer information
- Booking details
- Payment link (on status updates)
- Notes (on status updates)

## Installation Steps

1. **Install dependencies:**
   ```bash
   cd /Users/tiagocordeiro/Desktop/DBLUXCARSWEB/dbcars/backend
   npm install
   ```

2. **Configure environment variables** in `backend/.env`:
   ```bash
   BREVO_API_KEY=your_key_here
   BREVO_SENDER_EMAIL=your-sender@example.com
   BREVO_SENDER_NAME=DB Luxury Cars
   BREVO_ADMIN_EMAIL=admin@example.com
   ```

3. **Restart the backend server:**
   ```bash
   npm run dev
   ```

## Testing

### Test New Booking Email
1. Go to the frontend booking page
2. Fill out the booking form
3. Click "Confirm Booking"
4. Check customer email and admin email (if configured)

### Test Status Update Email
1. Log in to admin panel
2. Go to Bookings section
3. Update a booking status (e.g., to "Waiting Payment")
4. Add a payment link and notes
5. Save changes
6. Check customer email and admin email

## Email Behavior

- **Fire-and-forget**: Emails are sent asynchronously and won't block API responses
- **Graceful degradation**: If Brevo API is not configured or fails, the booking/status update still succeeds
- **Console logging**: All email sends are logged to the console for debugging

## Troubleshooting

### Emails not sending?
1. Check console logs for `[Brevo]` messages
2. Verify `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` are set
3. Check Brevo API limits in your account
4. Verify sender email is verified in Brevo

### Payment link not appearing in email?
1. Make sure you added a payment link when updating status to "Waiting Payment" or "Confirmed"
2. The payment link field must contain a valid URL

### Admin not receiving emails?
1. Verify `BREVO_ADMIN_EMAIL` is set in `.env`
2. Check spam folder
3. Verify the email address in Brevo dashboard

## API Endpoints Reference

- `POST /api/bookings` - Creates booking + sends confirmation email
- `PUT /api/admin/bookings/:id` - Updates booking status + sends status email

