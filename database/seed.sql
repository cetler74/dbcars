-- Seed data for dbcars_db
-- Sample data for development and testing

-- Insert admin user (password: admin123 - should be hashed in production)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@dbcars.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'Admin User', 'admin');

-- Insert locations
INSERT INTO locations (name, address, city, country, phone, email, latitude, longitude) VALUES
('Casablanca Downtown', '123 Boulevard Mohammed V', 'Casablanca', 'Morocco', '+212 522 123456', 'casablanca@dbcars.com', 33.5731, -7.5898),
('Marrakech Guéliz', '456 Avenue Mohammed VI', 'Marrakech', 'Morocco', '+212 524 123456', 'marrakech@dbcars.com', 31.6295, -7.9811),
('Rabat Center', '789 Avenue Allal Ben Abdellah', 'Rabat', 'Morocco', '+212 537 123456', 'rabat@dbcars.com', 34.0209, -6.8416),
('Fez Medina', '321 Rue Talaa Kebira', 'Fez', 'Morocco', '+212 535 123456', 'fez@dbcars.com', 34.0625, -4.9736);

-- Insert sample vehicles
INSERT INTO vehicles (make, model, year, category, description, seats, transmission, fuel_type, features, base_price_daily, base_price_weekly, base_price_monthly, minimum_rental_days, minimum_age) VALUES
('Mercedes-Benz', 'S-Class', 2024, 'luxury', 'Experience ultimate luxury with the Mercedes-Benz S-Class. Premium comfort and cutting-edge technology.', 5, 'automatic', 'gasoline', ARRAY['GPS Navigation', 'Leather Seats', 'Sunroof', 'Premium Sound System', 'Bluetooth'], 250.00, 1500.00, 6000.00, 1, 25),
('BMW', '7 Series', 2024, 'luxury', 'The epitome of BMW luxury and performance. Perfect for business or leisure.', 5, 'automatic', 'gasoline', ARRAY['GPS Navigation', 'Leather Seats', 'Panoramic Roof', 'Premium Sound System', 'Wireless Charging'], 280.00, 1700.00, 6500.00, 1, 25),
('Audi', 'A8', 2024, 'luxury', 'Sophisticated design meets advanced technology in the Audi A8.', 5, 'automatic', 'gasoline', ARRAY['GPS Navigation', 'Leather Seats', 'Sunroof', 'Premium Sound System', 'Massage Seats'], 270.00, 1600.00, 6300.00, 1, 25),
('Porsche', '911', 2024, 'super_luxury', 'Iconic sports car with legendary performance. For the ultimate driving experience.', 2, 'automatic', 'gasoline', ARRAY['GPS Navigation', 'Leather Seats', 'Sport Mode', 'Premium Sound System'], 450.00, 2800.00, 11000.00, 2, 30),
('Lamborghini', 'Huracán', 2024, 'exotic', 'Exotic supercar that turns heads. Experience the thrill of Italian engineering.', 2, 'automatic', 'gasoline', ARRAY['GPS Navigation', 'Racing Seats', 'Sport Mode', 'Premium Sound System'], 1200.00, 7500.00, 30000.00, 3, 30),
('Range Rover', 'Autobiography', 2024, 'luxury', 'Luxury SUV perfect for exploring Morocco''s diverse landscapes.', 7, 'automatic', 'diesel', ARRAY['GPS Navigation', 'Leather Seats', 'Panoramic Roof', 'Premium Sound System', 'All-Wheel Drive'], 350.00, 2100.00, 8500.00, 1, 25);

-- Insert vehicle subunits
INSERT INTO vehicle_subunits (vehicle_id, license_plate, vin, status, current_location_id) VALUES
((SELECT id FROM vehicles WHERE make = 'Mercedes-Benz' AND model = 'S-Class' LIMIT 1), 'CAS-001', 'WDDNG8GB5NA123456', 'available', (SELECT id FROM locations WHERE city = 'Casablanca' LIMIT 1)),
((SELECT id FROM vehicles WHERE make = 'BMW' AND model = '7 Series' LIMIT 1), 'CAS-002', 'WBA7A0C50ED123456', 'available', (SELECT id FROM locations WHERE city = 'Casablanca' LIMIT 1)),
((SELECT id FROM vehicles WHERE make = 'Audi' AND model = 'A8' LIMIT 1), 'RAB-001', 'WAUZZZ4G0DN123456', 'available', (SELECT id FROM locations WHERE city = 'Rabat' LIMIT 1)),
((SELECT id FROM vehicles WHERE make = 'Porsche' AND model = '911' LIMIT 1), 'MAR-001', 'WP0ZZZ99ZKS123456', 'available', (SELECT id FROM locations WHERE city = 'Marrakech' LIMIT 1)),
((SELECT id FROM vehicles WHERE make = 'Lamborghini' AND model = 'Huracán' LIMIT 1), 'MAR-002', 'ZHWUC1ZF5KLA12345', 'available', (SELECT id FROM locations WHERE city = 'Marrakech' LIMIT 1)),
((SELECT id FROM vehicles WHERE make = 'Range Rover' AND model = 'Autobiography' LIMIT 1), 'FEZ-001', 'SALVA2BG8EH123456', 'available', (SELECT id FROM locations WHERE city = 'Fez' LIMIT 1));

-- Insert extras
INSERT INTO extras (name, description, price, price_type) VALUES
('GPS Navigation', 'Portable GPS navigation device', 10.00, 'per_rental'),
('Child Seat', 'Child safety seat for infants and toddlers', 15.00, 'per_rental'),
('Additional Driver', 'Add an additional authorized driver', 25.00, 'per_rental'),
('Full Insurance Coverage', 'Comprehensive insurance with zero deductible', 50.00, 'per_day'),
('Airport Delivery', 'Vehicle delivery to airport', 75.00, 'per_rental'),
('Premium Cleaning', 'Premium interior and exterior cleaning', 30.00, 'per_rental');

-- Insert pricing plan
INSERT INTO pricing_plans (name, description) VALUES
('Standard Plan', 'Standard pricing for all vehicles'),
('Premium Plan', 'Premium pricing with additional services');

-- Insert sample customer
INSERT INTO customers (first_name, last_name, email, phone, date_of_birth, license_number, license_country, address, city, country) VALUES
('John', 'Doe', 'john.doe@example.com', '+212 612 345678', '1990-01-15', 'DL123456', 'Morocco', '123 Main Street', 'Casablanca', 'Morocco');

-- Insert sample coupon
INSERT INTO coupons (code, description, discount_type, discount_value, valid_from, valid_until, usage_limit, is_active) VALUES
('WELCOME10', 'Welcome discount for new customers', 'percentage', 10.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 100, true),
('SUMMER2025', 'Summer promotion', 'percentage', 15.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 50, true);

