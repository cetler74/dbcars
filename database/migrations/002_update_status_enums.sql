-- Normalize booking and vehicle_subunit status values and add basic constraints

-- 1) Migrate existing vehicle_subunits statuses
UPDATE vehicle_subunits
SET status = 'out_on_rent'
WHERE status = 'rented';

UPDATE vehicle_subunits
SET status = 'maintenance'
WHERE status = 'damaged';

-- 2) Ensure all existing bookings use allowed statuses
-- Map legacy 'active' to 'confirmed' for now (closest semantic)
UPDATE bookings
SET status = 'confirmed'
WHERE status = 'active';

-- 3) Optional: tighten allowed values with CHECK constraints
-- NOTE: If these already exist, adjust accordingly; this assumes none are present yet.
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'waiting_payment', 'confirmed', 'cancelled', 'completed'));

ALTER TABLE vehicle_subunits
  ADD CONSTRAINT vehicle_subunits_status_check
  CHECK (status IN ('available', 'reserved', 'out_on_rent', 'returned', 'maintenance'));


