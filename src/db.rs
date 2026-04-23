use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};

pub async fn init_pool() -> SqlitePool {
    SqlitePoolOptions::new()
        .max_connections(5)
        .connect("sqlite:smoothies.db?mode=rwc")
        .await
        .expect("Failed to connect to SQLite database")
}
