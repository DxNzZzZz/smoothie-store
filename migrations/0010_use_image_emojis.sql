-- Replace unicode emoji characters with image paths for all fruits/ingredients
UPDATE fruits SET emoji = '/emojis/fruits/banana.png'       WHERE name = 'Банан';
UPDATE fruits SET emoji = '/emojis/fruits/strawberry.png'   WHERE name = 'Ягода';
UPDATE fruits SET emoji = '/emojis/fruits/mango.png'        WHERE name = 'Манго';
UPDATE fruits SET emoji = '/emojis/fruits/blueberry.png'    WHERE name = 'Боровинка';
UPDATE fruits SET emoji = '/emojis/fruits/spinach.png'      WHERE name = 'Спанак';
UPDATE fruits SET emoji = '/emojis/fruits/pineapple.png'    WHERE name = 'Ананас';
UPDATE fruits SET emoji = '/emojis/fruits/avocado.png'      WHERE name = 'Авокадо';
UPDATE fruits SET emoji = '/emojis/fruits/kiwi.png'         WHERE name = 'Киви';
UPDATE fruits SET emoji = '/emojis/fruits/raspberry.png'    WHERE name = 'Малина';
UPDATE fruits SET emoji = '/emojis/fruits/peach.png'        WHERE name = 'Праскова';
UPDATE fruits SET emoji = '/emojis/fruits/cherry.png'       WHERE name = 'Череша';
UPDATE fruits SET emoji = '/emojis/fruits/greenapple.png'   WHERE name = 'Зелена ябълка';
UPDATE fruits SET emoji = '/emojis/fruits/pear.png'         WHERE name = 'Круша';
UPDATE fruits SET emoji = '/emojis/fruits/watermelon.png'   WHERE name = 'Диня';
UPDATE fruits SET emoji = '/emojis/fruits/kale.png'         WHERE name = 'Къдраво зеле';
UPDATE fruits SET emoji = '/emojis/fruits/passionfruit.png' WHERE name = 'Маракуя';

UPDATE fruits SET emoji = '/emojis/liquids/milk.png'          WHERE name = 'Прясно мляко';
UPDATE fruits SET emoji = '/emojis/liquids/water.png'         WHERE name = 'Вода';
UPDATE fruits SET emoji = '/emojis/liquids/coconutWater.png'  WHERE name = 'Кокосова вода';
UPDATE fruits SET emoji = '/emojis/liquids/yogurt.png'        WHERE name = 'Йогурт';
UPDATE fruits SET emoji = '/emojis/liquids/soyMilk.png'       WHERE name = 'Соево мляко';
UPDATE fruits SET emoji = '/emojis/liquids/riceMilk.png'      WHERE name = 'Оризово мляко';
UPDATE fruits SET emoji = '/emojis/liquids/cashewMilk.png'    WHERE name = 'Мляко от кашу';
UPDATE fruits SET emoji = '/emojis/liquids/pineappleJuice.png'  WHERE name = 'Сок от ананас';
UPDATE fruits SET emoji = '/emojis/liquids/pimegranetJuice.png' WHERE name = 'Сок от нар';
