-- Add payment_link column to bookings to support admin payment flow

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_link TEXT;


