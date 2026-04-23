ALTER TABLE admins ADD COLUMN is_superadmin BOOLEAN NOT NULL DEFAULT 0;
UPDATE admins SET is_superadmin = 1 WHERE username = 'admin';
