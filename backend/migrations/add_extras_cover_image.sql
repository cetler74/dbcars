-- Add cover_image column to extras table
ALTER TABLE extras
ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);

