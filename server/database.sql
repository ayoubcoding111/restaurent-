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
    description TEXT DEFAULT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample menu items
INSERT INTO items (name, price, category, description, image_url, is_available) VALUES
('Margherita Pizza', 12.99, 'pizzas', 'Classic Italian pizza with fresh mozzarella, tomatoes, and basil.', '/uploads/pizza1.jpg', 1),
('Beef Tacos', 8.99, 'tacos', 'Crispy corn tortillas filled with seasoned beef, lettuce, and salsa.', '/uploads/taco1.jpg', 1),
('Sprite', 2.99, 'drinks', 'Refreshing lemon-lime soda, served ice cold.', '/uploads/sprite.jpg', 1),
('Coca-Cola', 2.99, 'drinks', 'The classic cola taste you love, perfectly chilled.', '/uploads/coca.jpg', 1),
('Family Pack', 24.99, 'familypack', 'Feeds 4-6 people: 2 large pizzas, wings, and sides.', '/uploads/familypack.jpg', 1);

-- ============================================
-- Staff accounts table (admin + staff users)
-- ============================================
CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    reset_token VARCHAR(128) DEFAULT NULL,
    reset_expires DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin account (username: admin / password: admin123)
-- Note: server.js auto-creates this on first run if missing
-- This INSERT is just a safety net for manual setup
-- The bcrypt hash below is for 'admin123' with salt rounds = 10
-- Change the password immediately after first login.
INSERT IGNORE INTO staff (username, email, password, full_name, role)
VALUES ('admin', 'admin@delicious-restaurant.com', '$2a$10$XFE/UQEHkPKQSaRjpgXKYOZhGlDqCwCmGhYYLkMNjYVY1V8LqWGPe', 'Administrator', 'admin');

-- ============================================
-- Item options table (customizations: ingredients, sizes…)
-- group e.g. "Extra ingredients" (multi) or "Size" (single)
-- price_delta is ADDED to the base price when chosen
-- ============================================
CREATE TABLE IF NOT EXISTS item_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    group_name VARCHAR(100) NOT NULL DEFAULT 'Extras',
    group_fr VARCHAR(100) DEFAULT NULL,
    group_ar VARCHAR(100) DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) DEFAULT NULL,
    name_ar VARCHAR(255) DEFAULT NULL,
    price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0,
    choice ENUM('single', 'multi') NOT NULL DEFAULT 'multi',
    sort_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Sample options, attached by CATEGORY so they work whatever the dishes are named
-- (prices are examples — adjust per item in Admin → Menu Items → Edit)
INSERT INTO item_options (item_id, group_name, group_fr, group_ar, name, name_fr, name_ar, price_delta, choice, sort_order)
SELECT id, 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية', 'Extra Cheese', 'Fromage supplémentaire', 'جبن إضافي', 2.50, 'multi', 1 FROM items WHERE category = 'pizzas'
UNION ALL SELECT id, 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية', 'Mushrooms', 'Champignons', 'فطر', 1.50, 'multi', 2 FROM items WHERE category = 'pizzas'
UNION ALL SELECT id, 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية', 'Olives', 'Olives', 'زيتون', 1.00, 'multi', 3 FROM items WHERE category = 'pizzas'
UNION ALL SELECT id, 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية', 'Extra Meat', 'Viande supplémentaire', 'لحم إضافي', 3.00, 'multi', 1 FROM items WHERE category = 'tacos'
UNION ALL SELECT id, 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية', 'Cheese', 'Fromage', 'جبن', 1.50, 'multi', 2 FROM items WHERE category = 'tacos'
UNION ALL SELECT id, 'Extra ingredients', 'Ingrédients supplémentaires', 'مكونات إضافية', 'Guacamole', 'Guacamole', 'غواكامولي', 2.00, 'multi', 3 FROM items WHERE category = 'tacos'
UNION ALL SELECT id, 'Size', 'Taille', 'الحجم', '30cl', '30cl', '30سل', 0.00, 'single', 1 FROM items WHERE category = 'drinks'
UNION ALL SELECT id, 'Size', 'Taille', 'الحجم', '1L', '1L', '1ل', 2.00, 'single', 2 FROM items WHERE category = 'drinks'
UNION ALL SELECT id, 'Size', 'Taille', 'الحجم', '2L', '2L', '2ل', 4.00, 'single', 3 FROM items WHERE category = 'drinks'
UNION ALL SELECT id, 'Extras', 'Extras', 'إضافات', 'Extra Wings', 'Ailes supplémentaires', 'أجنحة إضافية', 5.00, 'multi', 1 FROM items WHERE category = 'familypack'
UNION ALL SELECT id, 'Extras', 'Extras', 'إضافات', 'Extra Drink', 'Boisson supplémentaire', 'مشروب إضافي', 2.00, 'multi', 2 FROM items WHERE category = 'familypack';

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
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered') NOT NULL DEFAULT 'pending',
    zone_id INT DEFAULT NULL,
    subtotal DECIMAL(10, 2) DEFAULT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    assigned_to INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL
);

-- ============================================
-- Reviews table (item ratings, admin-moderated)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    rater_name VARCHAR(100) NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT DEFAULT NULL,
    is_approved TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_reviews_item (item_id, is_approved)
);

-- ============================================
-- Delivery zones (fees computed server-side)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) DEFAULT NULL,
    name_ar VARCHAR(100) DEFAULT NULL,
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    free_over DECIMAL(10, 2) DEFAULT NULL,
    eta_min INT DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0
);

INSERT IGNORE INTO delivery_zones (id, name, name_fr, name_ar, fee, free_over, eta_min, is_active, sort_order) VALUES
(1, 'City Center', 'Centre-ville', 'وسط المدينة', 2.00, 30.00, 30, 1, 1),
(2, 'Suburbs', 'Banlieue', 'الضواحي', 4.00, 50.00, 45, 1, 2),
(3, 'Outskirts', 'Périphérie', 'الأطراف', 6.00, NULL, 60, 1, 3);

