-- Remove duplicate Киви (id=22) and Праскова (id=20) added by migration 0006.
-- The originals (id=8 Киви, id=10 Праскова) are kept because they are
-- referenced by existing smoothie_fruits rows.
DELETE FROM fruits WHERE id IN (20, 22);
