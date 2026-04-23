-- Admin table
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- Seed 'admin' user with password 'admin'
INSERT INTO admins (username, password_hash)
VALUES ('admin', 'admin');

-- Extend fruits with pricing and liquid specifier
ALTER TABLE fruits ADD COLUMN price_per_100g REAL NOT NULL DEFAULT 1.0;
ALTER TABLE fruits ADD COLUMN is_liquid BOOLEAN NOT NULL DEFAULT 0;

-- Set realistic base prices for fruits per 100g
UPDATE fruits SET price_per_100g = 0.50 WHERE name = 'Banana';
UPDATE fruits SET price_per_100g = 1.20 WHERE name = 'Strawberry';
UPDATE fruits SET price_per_100g = 1.50 WHERE name = 'Mango';
UPDATE fruits SET price_per_100g = 1.80 WHERE name = 'Blueberry';
UPDATE fruits SET price_per_100g = 0.80 WHERE name = 'Spinach';
UPDATE fruits SET price_per_100g = 1.00 WHERE name = 'Pineapple';
UPDATE fruits SET price_per_100g = 2.00 WHERE name = 'Avocado';
UPDATE fruits SET price_per_100g = 1.00 WHERE name = 'Kiwi';
UPDATE fruits SET price_per_100g = 2.50 WHERE name = 'Raspberry';
UPDATE fruits SET price_per_100g = 1.20 WHERE name = 'Peach';

-- Insert liquids
INSERT INTO fruits (name, emoji, calories, protein_g, carbs_g, fat_g, fiber_g, price_per_100g, is_liquid) 
VALUES
('Milk',          '🥛', 42, 3.4,  4.8, 1.0, 0.0, 0.20, 1),
('Water',         '💧',  0, 0.0,  0.0, 0.0, 0.0, 0.00, 1),
('Coconut Water', '🥥', 19, 0.7,  3.7, 0.2, 1.1, 0.50, 1),
('Yogurt',        '🥣', 59, 10.0, 3.6, 0.4, 0.0, 0.40, 1);

-- Extend smoothies and orders
ALTER TABLE smoothies ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
