-- Migration: Update Vehicle Categories
-- Updates existing categories to new category system

-- Update existing category values to new ones
UPDATE vehicles SET category = 'luxury_sedans' WHERE category = 'luxury';
UPDATE vehicles SET category = 'supercars' WHERE category = 'exotic';
UPDATE vehicles SET category = 'sportscars' WHERE category = 'super_luxury';

-- Add comment to category column
COMMENT ON COLUMN vehicles.category IS 'Vehicle category: luxury_sedans, economic, sportscars, supercars, suvs';

