-- Seed fruits (calories/macros per 100g)
INSERT INTO fruits (name, emoji, calories, protein_g, carbs_g, fat_g, fiber_g) VALUES
    ('Banana',      '🍌', 89,  1.1, 23.0, 0.3, 2.6),
    ('Strawberry',  '🍓', 32,  0.7,  7.7, 0.3, 2.0),
    ('Mango',       '🥭', 60,  0.8, 15.0, 0.4, 1.6),
    ('Blueberry',   '🫐', 57,  0.7, 14.0, 0.3, 2.4),
    ('Spinach',     '🥬', 23,  2.9,  3.6, 0.4, 2.2),
    ('Pineapple',   '🍍', 50,  0.5, 13.0, 0.1, 1.4),
    ('Avocado',     '🥑',160,  2.0,  9.0,15.0, 7.0),
    ('Kiwi',        '🥝', 61,  1.1, 15.0, 0.5, 3.0),
    ('Raspberry',   '🍇', 52,  1.2, 12.0, 0.7, 6.5),
    ('Peach',       '🍑', 39,  0.9, 10.0, 0.3, 1.5);

-- Seed smoothies
INSERT INTO smoothies (name, description, price, tags, emoji) VALUES
    ('Green Power',       'A vibrant blend of spinach, banana and pineapple for the ultimate energy boost.', 6.99, 'vegan,high-fiber,energy',       '💚'),
    ('Tropical Sunrise',  'Mango, pineapple and kiwi transport you straight to the tropics.',                7.49, 'vegan,vitamin-c,refreshing',    '🌅'),
    ('Berry Blast',       'Strawberries, blueberries and raspberries packed with antioxidants.',             6.99, 'vegan,antioxidant,low-fat',     '💜'),
    ('Creamy Avocado',    'Avocado, banana and kiwi for a rich, smooth, healthy-fat boost.',                 7.99, 'vegan,healthy-fats,creamy',     '🥑'),
    ('Peach Dream',       'Peach, mango and banana — sweet, light and absolutely dreamy.',                   6.49, 'vegan,low-cal,sweet',           '🍑');

-- Green Power: 200g spinach + 150g banana + 100g pineapple
INSERT INTO smoothie_fruits (smoothie_id, fruit_id, grams) VALUES
    (1, 5, 200),
    (1, 1, 150),
    (1, 6, 100);

-- Tropical Sunrise: 150g mango + 150g pineapple + 100g kiwi
INSERT INTO smoothie_fruits (smoothie_id, fruit_id, grams) VALUES
    (2, 3, 150),
    (2, 6, 150),
    (2, 8, 100);

-- Berry Blast: 150g strawberry + 100g blueberry + 100g raspberry
INSERT INTO smoothie_fruits (smoothie_id, fruit_id, grams) VALUES
    (3, 2, 150),
    (3, 4, 100),
    (3, 9, 100);

-- Creamy Avocado: 100g avocado + 120g banana + 100g kiwi
INSERT INTO smoothie_fruits (smoothie_id, fruit_id, grams) VALUES
    (4, 7, 100),
    (4, 1, 120),
    (4, 8, 100);

-- Peach Dream: 200g peach + 100g mango + 100g banana
INSERT INTO smoothie_fruits (smoothie_id, fruit_id, grams) VALUES
    (5, 10, 200),
    (5, 3,  100),
    (5, 1,  100);
