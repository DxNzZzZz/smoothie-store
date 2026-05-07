use rocket::form::FromForm;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Order {
    pub id: i64,
    pub smoothie_id: i64,
    pub size: String,
    pub customer_name: String,
    pub created_at: String,
    pub status: String,
    pub user_id: Option<i64>,
}

#[derive(Debug, FromForm, Deserialize)]
pub struct OrderForm {
    pub smoothie_id: i64,
    pub size: String,
    pub customer_name: Option<String>,
}

pub async fn create_order(pool: &SqlitePool, form: &OrderForm, user_id: Option<i64>, fallback_name: Option<String>) -> Result<i64, sqlx::Error> {
    let final_name = fallback_name.or(form.customer_name.clone()).unwrap_or_else(|| "Гост".to_string());
    
    let result = sqlx::query(
        "INSERT INTO orders (smoothie_id, size, customer_name, status, user_id) VALUES (?, ?, ?, 'pending', ?)",
    )
    .bind(form.smoothie_id)
    .bind(&form.size)
    .bind(&final_name)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.last_insert_rowid())
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct OrderWithSmoothie {
    pub id: i64,
    pub smoothie_id: i64,
    pub smoothie_name: String,
    pub smoothie_emoji: String,
    pub size: String,
    pub customer_name: String,
    pub created_at: String,
    pub status: String,
    pub is_custom: bool,
    pub user_id: Option<i64>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct OrderIngredient {
    pub name: String,
    pub emoji: String,
    pub grams: f64,
}

#[derive(Debug, Serialize)]
pub struct PendingOrder {
    pub id: i64,
    pub smoothie_name: String,
    pub smoothie_emoji: String,
    pub size: String,
    pub customer_name: String,
    pub created_at: String,
    pub is_custom: bool,
    pub user_id: Option<i64>,
    pub ingredients: Vec<OrderIngredient>,
}

pub async fn get_pending_orders(pool: &SqlitePool) -> Vec<PendingOrder> {
    let orders = sqlx::query_as::<_, OrderWithSmoothie>(
        r#"
        SELECT o.id, o.smoothie_id, s.name as smoothie_name, s.emoji as smoothie_emoji,
               o.size, o.customer_name, o.created_at, o.status, s.is_custom, o.user_id
        FROM orders o
        JOIN smoothies s ON s.id = o.smoothie_id
        WHERE o.status = 'pending'
        ORDER BY o.created_at ASC
        "#
    )
    .fetch_all(pool)
    .await
    .unwrap_or_else(|e| { eprintln!("DB error fetching pending orders: {e}"); vec![] });

    let size_factor = |size: &str| match size {
        "small" => 0.7,
        "large" => 1.3,
        _ => 1.0,
    };

    let mut result = Vec::with_capacity(orders.len());
    for o in orders {
        let factor = size_factor(&o.size);
        let ingredients = sqlx::query_as::<_, OrderIngredient>(
            r#"
            SELECT f.name, f.emoji, ROUND(sf.grams * ?, 0) as grams
            FROM smoothie_fruits sf
            JOIN fruits f ON f.id = sf.fruit_id
            WHERE sf.smoothie_id = ?
            ORDER BY sf.grams DESC
            "#
        )
        .bind(factor)
        .bind(o.smoothie_id)
        .fetch_all(pool)
        .await
        .unwrap_or_else(|e| { eprintln!("DB error fetching ingredients for order {}: {e}", o.id); vec![] });

        result.push(PendingOrder {
            id: o.id,
            smoothie_name: o.smoothie_name,
            smoothie_emoji: o.smoothie_emoji,
            size: o.size,
            customer_name: o.customer_name,
            created_at: o.created_at,
            is_custom: o.is_custom,
            user_id: o.user_id,
            ingredients,
        });
    }
    result
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct UserOrderIngredient {
    pub id: i64,
    pub name: String,
    pub emoji: String,
    pub is_liquid: bool,
    pub grams: f64,
    pub calories: f64,
    pub protein_g: f64,
    pub carbs_g: f64,
    pub fat_g: f64,
}

#[derive(Debug, Serialize)]
pub struct UserOrderDetail {
    pub id: i64,
    pub smoothie_id: i64,
    pub smoothie_name: String,
    pub smoothie_emoji: String,
    pub size: String,
    pub created_at: String,
    pub status: String,
    pub is_custom: bool,
    pub ingredients: Vec<UserOrderIngredient>,
    pub total_calories: f64,
    pub total_protein: f64,
    pub total_carbs: f64,
    pub total_fat: f64,
}

pub async fn get_user_orders(pool: &SqlitePool, user_id: i64) -> Vec<UserOrderDetail> {
    let rows = sqlx::query_as::<_, OrderWithSmoothie>(
        r#"
        SELECT o.id, o.smoothie_id, s.name as smoothie_name, s.emoji as smoothie_emoji,
               o.size, o.customer_name, o.created_at, o.status, s.is_custom, o.user_id
        FROM orders o
        JOIN smoothies s ON s.id = o.smoothie_id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        "#
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .unwrap_or_else(|e| { eprintln!("DB error fetching user orders: {e}"); vec![] });

    let size_factor = |size: &str| match size {
        "small" => 0.7,
        "large" => 1.3,
        _ => 1.0,
    };

    let mut result = Vec::with_capacity(rows.len());
    for o in rows {
        let factor = size_factor(&o.size);
        let ingredients = sqlx::query_as::<_, UserOrderIngredient>(
            r#"
            SELECT f.id, f.name, f.emoji, f.is_liquid,
                   ROUND(sf.grams * ?, 0) as grams,
                   ROUND(f.calories  * sf.grams * ? / 100.0, 1) as calories,
                   ROUND(f.protein_g * sf.grams * ? / 100.0, 1) as protein_g,
                   ROUND(f.carbs_g   * sf.grams * ? / 100.0, 1) as carbs_g,
                   ROUND(f.fat_g     * sf.grams * ? / 100.0, 1) as fat_g
            FROM smoothie_fruits sf
            JOIN fruits f ON f.id = sf.fruit_id
            WHERE sf.smoothie_id = ?
            ORDER BY sf.grams DESC
            "#
        )
        .bind(factor).bind(factor).bind(factor).bind(factor).bind(factor)
        .bind(o.smoothie_id)
        .fetch_all(pool)
        .await
        .unwrap_or_else(|e| { eprintln!("DB error fetching ingredients for order {}: {e}", o.id); vec![] });

        let total_calories = ingredients.iter().map(|i| i.calories).sum();
        let total_protein  = ingredients.iter().map(|i| i.protein_g).sum();
        let total_carbs    = ingredients.iter().map(|i| i.carbs_g).sum();
        let total_fat      = ingredients.iter().map(|i| i.fat_g).sum();

        result.push(UserOrderDetail {
            id: o.id,
            smoothie_id: o.smoothie_id,
            smoothie_name: o.smoothie_name,
            smoothie_emoji: o.smoothie_emoji,
            size: o.size,
            created_at: o.created_at,
            status: o.status,
            is_custom: o.is_custom,
            ingredients,
            total_calories,
            total_protein,
            total_carbs,
            total_fat,
        });
    }
    result
}

pub async fn complete_order(pool: &SqlitePool, order_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE orders SET status = 'completed' WHERE id = ?")
        .bind(order_id)
        .execute(pool)
        .await?;
    Ok(())
}
