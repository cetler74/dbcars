-- Add cover_image and hero_image columns to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS hero_image VARCHAR(500);

-- Migrate existing featured_image to cover_image for backward compatibility
UPDATE blog_posts 
SET cover_image = featured_image 
WHERE cover_image IS NULL AND featured_image IS NOT NULL;

