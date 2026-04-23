-- Individual fruits with macronutrients per 100g
CREATE TABLE IF NOT EXISTS fruits (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    emoji     TEXT    NOT NULL,
    calories  REAL    NOT NULL,
    protein_g REAL    NOT NULL,
    carbs_g   REAL    NOT NULL,
    fat_g     REAL    NOT NULL,
    fiber_g   REAL    NOT NULL
);

-- Smoothie metadata (macros are computed from ingredients)
CREATE TABLE IF NOT EXISTS smoothies (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL,
    price       REAL    NOT NULL,
    tags        TEXT    NOT NULL,
    emoji       TEXT    NOT NULL
);

-- Junction: which fruits go into each smoothie and how many grams
CREATE TABLE IF NOT EXISTS smoothie_fruits (
    smoothie_id INTEGER NOT NULL REFERENCES smoothies(id),
    fruit_id    INTEGER NOT NULL REFERENCES fruits(id),
    grams       REAL    NOT NULL,
    PRIMARY KEY (smoothie_id, fruit_id)
);

-- Customer orders
CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    smoothie_id   INTEGER NOT NULL REFERENCES smoothies(id),
    size          TEXT    NOT NULL,
    customer_name TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
