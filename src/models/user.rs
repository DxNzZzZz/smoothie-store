use serde::Serialize;
use sqlx::SqlitePool;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub password: String,
    pub full_name: String,
}

pub async fn get_user_by_email(pool: &SqlitePool, email: &str) -> Option<User> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
}

pub async fn get_user_by_id(pool: &SqlitePool, id: i64) -> Option<User> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
}

pub async fn update_user_password(pool: &SqlitePool, id: i64, new_hash: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE users SET password = ? WHERE id = ?")
        .bind(new_hash)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn create_user(pool: &SqlitePool, email: &str, password: &str, full_name: &str) -> Result<i64, sqlx::Error> {
    let result = sqlx::query("INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)")
        .bind(email)
        .bind(password)
        .bind(full_name)
        .execute(pool)
        .await?;

    Ok(result.last_insert_rowid())
}
