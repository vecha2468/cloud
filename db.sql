-- reservation_system database schema

-- Users table (customers, restaurant managers, admins)
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(20),
  `role` ENUM('customer', 'restaurant_manager', 'admin') NOT NULL DEFAULT 'customer',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Restaurants table
CREATE TABLE `restaurants` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `cuisine_type` VARCHAR(50),
  `address_line1` VARCHAR(100) NOT NULL,
  `address_line2` VARCHAR(100),
  `city` VARCHAR(50) NOT NULL,
  `state` VARCHAR(50) NOT NULL,
  `zip_code` VARCHAR(20) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100),
  `website` VARCHAR(255),
  `cost_rating` INT DEFAULT 2 CHECK (cost_rating BETWEEN 1 AND 5),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `is_approved` BOOLEAN DEFAULT FALSE,
  `manager_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Restaurant photos
CREATE TABLE `restaurant_photos` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `restaurant_id` INT NOT NULL,
  `photo_url` VARCHAR(255) NOT NULL,
  `is_primary` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
);

-- Restaurant operating hours
CREATE TABLE `operating_hours` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `restaurant_id` INT NOT NULL,
  `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  `opening_time` TIME NOT NULL,
  `closing_time` TIME NOT NULL,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_restaurant_day` (`restaurant_id`, `day_of_week`)
);

-- Tables available at restaurants
CREATE TABLE `tables` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `restaurant_id` INT NOT NULL,
  `capacity` INT NOT NULL,
  `table_number` VARCHAR(20) NOT NULL,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_restaurant_table` (`restaurant_id`, `table_number`)
);

-- Reservations
CREATE TABLE `reservations` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `customer_id` INT NOT NULL,
  `restaurant_id` INT NOT NULL,
  `table_id` INT NOT NULL,
  `reservation_date` DATE NOT NULL,
  `reservation_time` TIME NOT NULL,
  `party_size` INT NOT NULL,
  `status` ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  `special_request` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON DELETE CASCADE
);

-- Reviews
CREATE TABLE `reviews` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `customer_id` INT NOT NULL,
  `restaurant_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
);

-- Insert admin user
INSERT INTO `users` (`email`, `password`, `first_name`, `last_name`, `role`) 
VALUES ('admin@example.com', '$2b$10$HkQvGy4rTKJZ7HZf1wHCCO9BwMqQ1I5LUfVlj5h1O/xbUQJ8V2iHS', 'System', 'Admin', 'admin');
-- Password is 'admin123' (hashed with bcrypt)

-- Insert sample restaurant manager
INSERT INTO `users` (`email`, `password`, `first_name`, `last_name`, `phone`, `role`) 
VALUES ('manager@example.com', '$2b$10$HkQvGy4rTKJZ7HZf1wHCCO9BwMqQ1I5LUfVlj5h1O/xbUQJ8V2iHS', 'Restaurant', 'Manager', '555-123-4567', 'restaurant_manager');
-- Password is 'admin123' (hashed with bcrypt)

-- Insert sample customer
INSERT INTO `users` (`email`, `password`, `first_name`, `last_name`, `phone`) 
VALUES ('customer@example.com', '$2b$10$HkQvGy4rTKJZ7HZf1wHCCO9BwMqQ1I5LUfVlj5h1O/xbUQJ8V2iHS', 'Sample', 'Customer', '555-987-6543');
-- Password is 'admin123' (hashed with bcrypt)
