-- Create invoices table for invoice management
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT NOT NULL,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);

-- Create trigger for updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sequence for invoice number generation (year-based)
-- Format: INV-YYYY-XXXX where XXXX is sequential number
CREATE SEQUENCE IF NOT EXISTS invoice_sequence_2025 START 1;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    sequence_name TEXT;
    sequence_num INTEGER;
    invoice_num VARCHAR(50);
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    sequence_name := 'invoice_sequence_' || current_year;
    
    -- Create sequence if it doesn't exist for current year
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = sequence_name) THEN
        EXECUTE format('CREATE SEQUENCE %I START 1', sequence_name);
    END IF;
    
    -- Get next sequence number
    EXECUTE format('SELECT nextval(%L)', sequence_name) INTO sequence_num;
    
    -- Format: INV-YYYY-XXXX
    invoice_num := 'INV-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

