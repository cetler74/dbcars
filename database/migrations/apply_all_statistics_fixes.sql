-- Comprehensive migration to fix Statistics & Reports functionality
-- This script ensures all required tables and columns exist for statistics

-- 1. Create blog_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image VARCHAR(500),
  is_published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- 2. Add payment_link column to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_link TEXT;

-- 3. Add waiting_payment status to bookings (update status enum if needed)
-- Note: Since we're using VARCHAR, no need to alter enum
-- Valid statuses: pending, waiting_payment, confirmed, active, completed, cancelled

-- 4. Create vehicle_extras junction table
CREATE TABLE IF NOT EXISTS vehicle_extras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    extra_id UUID NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, extra_id)
);

-- Create indexes for vehicle_extras
CREATE INDEX IF NOT EXISTS idx_vehicle_extras_vehicle_id ON vehicle_extras(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_extras_extra_id ON vehicle_extras(extra_id);

-- 5. Add customer blacklist columns
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;

-- 6. Add color column to vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- 7. Add cover_image column to extras
ALTER TABLE extras
  ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);

-- 8. Update vehicle_subunits status values
-- Valid statuses: available, reserved, out_on_rent, returned, maintenance
-- No ALTER needed since we use VARCHAR, but ensuring indexes exist

-- 9. Add performance indexes for statistics queries
CREATE INDEX IF NOT EXISTS idx_bookings_status_dates ON bookings(status, pickup_date, dropoff_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_status ON bookings(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_vehicle_subunits_vehicle_status ON vehicle_subunits(vehicle_id, status);

-- 10. Create trigger for blog_posts updated_at if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_blog_posts_updated_at'
    ) THEN
        CREATE TRIGGER update_blog_posts_updated_at 
        BEFORE UPDATE ON blog_posts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Verify all tables exist
DO $$
BEGIN
    -- Check if critical tables exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts') THEN
        RAISE NOTICE 'WARNING: blog_posts table still missing after migration';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vehicle_extras') THEN
        RAISE NOTICE 'WARNING: vehicle_extras table still missing after migration';
    END IF;
    
    -- Check if critical columns exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_link') THEN
        RAISE NOTICE 'WARNING: bookings.payment_link column still missing after migration';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_blacklisted') THEN
        RAISE NOTICE 'WARNING: customers.is_blacklisted column still missing after migration';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'extras' AND column_name = 'cover_image') THEN
        RAISE NOTICE 'WARNING: extras.cover_image column still missing after migration';
    END IF;
    
    RAISE NOTICE 'Database migration completed successfully';
END
$$;

