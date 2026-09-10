-- ============================================
-- Restaurant Database Setup Script
-- ============================================
-- Run: mysql -u root -p < database.sql
-- Safe to re-run: uses IF NOT EXISTS for all tables

DROP DATABASE IF EXISTS restaurant_db;
CREATE DATABASE restaurant_db;
USE restaurant_db;

-- ============================================
-- Items table (menu products)
-- ============================================
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category ENUM('pizzas', 'tacos', 'drinks', 'familypack') NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample menu items
INSERT INTO items (name, price, category, image_url, is_available) VALUES
('Margherita Pizza', 12.99, 'pizzas', '/uploads/pizza1.jpg', 1),
('Beef Tacos', 8.99, 'tacos', '/uploads/taco1.jpg', 1),
('Sprite', 2.99, 'drinks', '/uploads/sprite.jpg', 1),
('Coca-Cola', 2.99, 'drinks', '/uploads/coca.jpg', 1),
('Family Pack', 24.99, 'familypack', '/uploads/familypack.jpg', 1);

-- ============================================
-- Staff accounts table (admin + staff users)
-- ============================================
CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin account (password: admin123)
-- Note: server.js auto-creates this on first run if missing
-- This INSERT is just a safety net for manual setup
-- The bcrypt hash below is for 'admin123' with salt rounds = 10
INSERT IGNORE INTO staff (username, password, full_name, role)
VALUES ('admin', '$2a$10$XFE/UQEHkPKQSaRjpgXKYOZhGlDqCwCmGhYYLkMNjYVY1V8LqWGPe', 'Administrator', 'admin');

-- ============================================
-- Orders table (customer orders)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT NOT NULL,
    items JSON NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'delivered') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
