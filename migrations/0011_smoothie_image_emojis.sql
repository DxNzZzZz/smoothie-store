ALTER TABLE smoothies ADD COLUMN emoji TEXT NOT NULL DEFAULT '';

UPDATE smoothies SET emoji = '/emojis/menu-smoothie/greenenergy.png'      WHERE name = 'Зелена Енергия';
UPDATE smoothies SET emoji = '/emojis/menu-smoothie/tropical_sunrise.png'  WHERE name = 'Тропически Изгрев';
UPDATE smoothies SET emoji = '/emojis/menu-smoothie/forest_punch.png'      WHERE name = 'Горски Удар';
UPDATE smoothies SET emoji = '/emojis/menu-smoothie/creemt_avocado.png'    WHERE name = 'Кремообразно Авокадо';
UPDATE smoothies SET emoji = '/emojis/menu-smoothie/preach_dream.png'      WHERE name = 'Прасковена Мечта';
