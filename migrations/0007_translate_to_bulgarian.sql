-- Превод на плодовете и съставките на български език
UPDATE fruits SET name = 'Банан' WHERE name = 'Banana';
UPDATE fruits SET name = 'Ягода' WHERE name = 'Strawberry';
UPDATE fruits SET name = 'Манго' WHERE name = 'Mango';
UPDATE fruits SET name = 'Боровинка' WHERE name = 'Blueberry';
UPDATE fruits SET name = 'Спанак' WHERE name = 'Spinach';
UPDATE fruits SET name = 'Ананас' WHERE name = 'Pineapple';
UPDATE fruits SET name = 'Авокадо' WHERE name = 'Avocado';
UPDATE fruits SET name = 'Киви' WHERE name = 'Kiwi';
UPDATE fruits SET name = 'Малина' WHERE name = 'Raspberry';
UPDATE fruits SET name = 'Праскова' WHERE name = 'Peach';
UPDATE fruits SET name = 'Соево мляко' WHERE name = 'Soy Milk';
UPDATE fruits SET name = 'Оризово мляко' WHERE name = 'Rice Milk';
UPDATE fruits SET name = 'Мляко от кашу' WHERE name = 'Cashew Milk';
UPDATE fruits SET name = 'Сок от ананас' WHERE name = 'Pineapple Juice';
UPDATE fruits SET name = 'Сок от нар' WHERE name = 'Pomegranate Juice';
UPDATE fruits SET name = 'Череша' WHERE name = 'Cherry';
UPDATE fruits SET name = 'Зелена ябълка' WHERE name = 'Green Apple';
UPDATE fruits SET name = 'Круша' WHERE name = 'Pear';
UPDATE fruits SET name = 'Диня' WHERE name = 'Watermelon';
UPDATE fruits SET name = 'Къдраво зеле' WHERE name = 'Kale';
UPDATE fruits SET name = 'Маракуя' WHERE name = 'Passionfruit';
UPDATE fruits SET name = 'Прясно мляко' WHERE name = 'Milk';
UPDATE fruits SET name = 'Вода' WHERE name = 'Water';
UPDATE fruits SET name = 'Кокосова вода' WHERE name = 'Coconut Water';
UPDATE fruits SET name = 'Йогурт' WHERE name = 'Yogurt';

-- Превод на смутитата (имена, описания и тагове)
UPDATE smoothies 
SET name = 'Зелена Енергия', 
    description = 'Ярък бленд от спанак, банан и ананас за максимален енергиен тласък.', 
    tags = 'веган,високи-фибри,енергия' 
WHERE name = 'Green Power';

UPDATE smoothies 
SET name = 'Тропически Изгрев', 
    description = 'Манго, ананас и киви ви пренасят директно в тропиците.', 
    tags = 'веган,витамин-c,освежаващо' 
WHERE name = 'Tropical Sunrise';

UPDATE smoothies 
SET name = 'Горски Удар', 
    description = 'Ягоди, боровинки и малини, пълни с антиоксиданти.', 
    tags = 'веган,антиоксиданти,нискомаслено' 
WHERE name = 'Berry Blast';

UPDATE smoothies 
SET name = 'Кремообразно Авокадо', 
    description = 'Авокадо, банан и киви за богат, гладък, здравословен тласък.', 
    tags = 'веган,здравословни-мазнини,кремообразно' 
WHERE name = 'Creamy Avocado';

UPDATE smoothies 
SET name = 'Прасковена Мечта', 
    description = 'Праскова, манго и банан — сладко, леко и абсолютно мечтателно.', 
    tags = 'веган,ниско-калорично,сладко' 
WHERE name = 'Peach Dream';
