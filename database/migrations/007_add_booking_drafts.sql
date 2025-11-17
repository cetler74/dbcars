-- Migration: Add booking drafts table
-- This table stores draft bookings that can be resumed later

CREATE TABLE IF NOT EXISTS booking_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL,
    customer_name VARCHAR(255),
    vehicle_name VARCHAR(255),
    total_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_booking_drafts_created_by ON booking_drafts(created_by);
CREATE INDEX idx_booking_drafts_updated_at ON booking_drafts(updated_at DESC);

-- Add comment to table
COMMENT ON TABLE booking_drafts IS 'Stores draft bookings that can be saved and resumed later';

