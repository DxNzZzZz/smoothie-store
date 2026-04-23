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
    pub smoothie_name: String,
    pub size: String,
    pub customer_name: String,
    pub created_at: String,
    pub status: String,
    pub is_custom: bool,
}

pub async fn get_pending_orders(pool: &SqlitePool) -> Vec<OrderWithSmoothie> {
    sqlx::query_as::<_, OrderWithSmoothie>(
        r#"
        SELECT o.id, s.name as smoothie_name, o.size, o.customer_name, o.created_at, o.status, s.is_custom
        FROM orders o
        JOIN smoothies s ON s.id = o.smoothie_id
        WHERE o.status = 'pending'
        ORDER BY o.created_at ASC
        "#
    )
    .fetch_all(pool)
    .await
    .unwrap_or_else(|e| { eprintln!("DB error fetching pending orders: {e}"); vec![] })
}

pub async fn get_user_orders(pool: &SqlitePool, user_id: i64) -> Vec<OrderWithSmoothie> {
    sqlx::query_as::<_, OrderWithSmoothie>(
        r#"
        SELECT o.id, s.name as smoothie_name, o.size, o.customer_name, o.created_at, o.status, s.is_custom
        FROM orders o
        JOIN smoothies s ON s.id = o.smoothie_id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        "#
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .unwrap_or_else(|e| { eprintln!("DB error fetching user orders: {e}"); vec![] })
}

pub async fn complete_order(pool: &SqlitePool, order_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE orders SET status = 'completed' WHERE id = ?")
        .bind(order_id)
        .execute(pool)
        .await?;
    Ok(())
}
