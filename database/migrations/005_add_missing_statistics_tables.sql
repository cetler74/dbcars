-- Add missing tables and columns for statistics functionality

-- Add vehicle_extras junction table (for associating extras with specific vehicles)
CREATE TABLE IF NOT EXISTS vehicle_extras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    extra_id UUID NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, extra_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_extras_vehicle_id ON vehicle_extras(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_extras_extra_id ON vehicle_extras(extra_id);

-- Add customer blacklist columns
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;

-- Add color column to vehicles if not exists
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Add cover_image column to extras if not exists
ALTER TABLE extras
  ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);

-- Update vehicle_subunits status to include additional statuses
-- Note: We don't need to ALTER the column type since we're using VARCHAR
-- Just documenting the valid values: 'available', 'reserved', 'out_on_rent', 'returned', 'maintenance'

-- Add index for booking status performance
CREATE INDEX IF NOT EXISTS idx_bookings_status_dates ON bookings(status, pickup_date, dropoff_date);

-- Add index for customer bookings count
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status ON bookings(customer_id, status);

-- Add index for vehicle bookings count
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_status ON bookings(vehicle_id, status);


