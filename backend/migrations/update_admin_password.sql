-- Update admin password to 'admin123'
-- This fixes the incomplete password hash in the seed data

UPDATE users 
SET password_hash = '$2a$10$1cPa3dStC8pU5WpX6ekbWesoiq5ULvHQvUQFMy8GV8R0kNBs8BA/a'
WHERE email = 'admin@dbcars.com';

-- If admin user doesn't exist, create it
INSERT INTO users (email, password_hash, name, role)
SELECT 'admin@dbcars.com', '$2a$10$1cPa3dStC8pU5WpX6ekbWesoiq5ULvHQvUQFMy8GV8R0kNBs8BA/a', 'Admin User', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@dbcars.com');

