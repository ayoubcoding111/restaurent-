-- Restaurant Database Setup Script
-- Drop database if exists and create fresh
DROP DATABASE IF EXISTS restaurant_db;
CREATE DATABASE restaurant_db;
USE restaurant_db;

-- Create items table
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category ENUM('pizzas', 'tacos', 'drinks', 'familypack') NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data (5 initial items)
INSERT INTO items (name, price, category, image_url, is_available) VALUES
('Margherita Pizza', 12.99, 'pizzas', '/uploads/pizza1.jpg', 1),
('Beef Tacos', 8.99, 'tacos', '/uploads/taco1.jpg', 1),
('Sprite', 2.99, 'drinks', '/uploads/sprite.jpg', 1),
('Coca-Cola', 2.99, 'drinks', '/uploads/coca.jpg', 1),
('Family Pack', 24.99, 'familypack', '/uploads/familypack.jpg', 1);
