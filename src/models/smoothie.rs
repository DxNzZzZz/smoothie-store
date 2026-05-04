use serde::Serialize;
use sqlx::SqlitePool;

/// Raw row returned by the macro-aggregation query
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SmoothieMacroRow {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub price: f64,
    pub tags: String,
    pub is_custom: bool,
    pub total_calories: Option<f64>,
    pub total_protein: Option<f64>,
    pub total_carbs: Option<f64>,
    pub total_fat: Option<f64>,
    pub total_fiber: Option<f64>,
}

/// Smoothie with computed macros, ready for templates
#[derive(Debug, Serialize)]
pub struct SmoothieWithMacros {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub price: f64,
    pub tags: Vec<String>,
    pub is_custom: bool,
    pub total_calories: f64,
    pub total_protein: f64,
    pub total_carbs: f64,
    pub total_fat: f64,
    pub total_fiber: f64,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Ingredient {
    pub id: i64,
    pub name: String,
    pub emoji: String,
    pub calories: f64,
    pub protein_g: f64,
    pub carbs_g: f64,
    pub fat_g: f64,
    pub fiber_g: f64,
    pub price_per_100g: f64,
    pub is_liquid: bool,
}

/// Individual fruit ingredient with grams used in a smoothie
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Fruit {
    pub id: i64,
    pub name: String,
    pub emoji: String,
    pub calories: f64,
    pub protein_g: f64,
    pub carbs_g: f64,
    pub fat_g: f64,
    pub fiber_g: f64,
    pub price_per_100g: f64,
    pub is_liquid: bool,
    pub grams: f64,
}

const MACRO_QUERY: &str = r#"
    SELECT
        s.id,
        s.name,
        s.description,
        s.price,
        s.tags,
        s.is_custom,
        ROUND(SUM(f.calories  * sf.grams / 100.0), 1) AS total_calories,
        ROUND(SUM(f.protein_g * sf.grams / 100.0), 1) AS total_protein,
        ROUND(SUM(f.carbs_g   * sf.grams / 100.0), 1) AS total_carbs,
        ROUND(SUM(f.fat_g     * sf.grams / 100.0), 1) AS total_fat,
        ROUND(SUM(f.fiber_g   * sf.grams / 100.0), 1) AS total_fiber
    FROM smoothies s
    LEFT JOIN smoothie_fruits sf ON sf.smoothie_id = s.id
    LEFT JOIN fruits f ON f.id = sf.fruit_id
"#;

pub async fn get_all_with_macros(pool: &SqlitePool) -> Vec<SmoothieWithMacros> {
    let query = format!("{} WHERE s.is_custom = 0 GROUP BY s.id", MACRO_QUERY);
    sqlx::query_as::<_, SmoothieMacroRow>(&query)
        .fetch_all(pool)
        .await
        .unwrap_or_else(|e| {
            eprintln!("DB error fetching menu: {e}");
            vec![]
        })
        .into_iter()
        .map(row_to_macros)
        .collect()
}

pub async fn get_by_id(pool: &SqlitePool, id: i64) -> Option<SmoothieWithMacros> {
    let query = format!("{} WHERE s.id = ? GROUP BY s.id", MACRO_QUERY);
    sqlx::query_as::<_, SmoothieMacroRow>(&query)
        .bind(id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .map(row_to_macros)
}

pub async fn get_fruits_for_smoothie(pool: &SqlitePool, smoothie_id: i64) -> Vec<Fruit> {
    sqlx::query_as::<_, Fruit>(
        r#"
        SELECT
            f.id, f.name, f.emoji,
            f.calories, f.protein_g, f.carbs_g, f.fat_g, f.fiber_g,
            f.price_per_100g, f.is_liquid,
            sf.grams
        FROM fruits f
        JOIN smoothie_fruits sf ON sf.fruit_id = f.id
        WHERE sf.smoothie_id = ?
        ORDER BY sf.grams DESC
        "#,
    )
    .bind(smoothie_id)
    .fetch_all(pool)
    .await
    .unwrap_or_else(|e| {
        eprintln!("DB error fetching smoothie fruits: {e}");
        vec![]
    })
}

pub async fn get_all_ingredients(pool: &SqlitePool) -> Vec<Ingredient> {
    sqlx::query_as::<_, Ingredient>("SELECT * FROM fruits ORDER BY is_liquid ASC, name ASC")
        .fetch_all(pool)
        .await
        .unwrap_or_else(|e| {
            eprintln!("DB error fetching ingredients: {e}");
            vec![]
        })
}

fn row_to_macros(row: SmoothieMacroRow) -> SmoothieWithMacros {
    SmoothieWithMacros {
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        tags: row.tags.split(',').map(|s| s.trim().to_string()).collect(),
        is_custom: row.is_custom,
        total_calories: row.total_calories.unwrap_or(0.0),
        total_protein: row.total_protein.unwrap_or(0.0),
        total_carbs: row.total_carbs.unwrap_or(0.0),
        total_fat: row.total_fat.unwrap_or(0.0),
        total_fiber: row.total_fiber.unwrap_or(0.0),
    }
}
