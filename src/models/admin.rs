use serde::Serialize;
use sqlx::SqlitePool;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Admin {
    pub id: i64,
    pub username: String,
    pub password_hash: String,
    pub is_superadmin: bool,
}

pub async fn get_admin_by_username(pool: &SqlitePool, username: &str) -> Option<Admin> {
    sqlx::query_as::<_, Admin>("SELECT * FROM admins WHERE username = ?")
        .bind(username)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
}

pub async fn get_admin_by_id(pool: &SqlitePool, id: i64) -> Option<Admin> {
    sqlx::query_as::<_, Admin>("SELECT * FROM admins WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
}

pub async fn create_admin(pool: &SqlitePool, username: &str, password_hash: &str, is_superadmin: bool) -> Result<i64, sqlx::Error> {
    let result = sqlx::query("INSERT INTO admins (username, password_hash, is_superadmin) VALUES (?, ?, ?)")
        .bind(username)
        .bind(password_hash)
        .bind(is_superadmin)
        .execute(pool)
        .await?;

    Ok(result.last_insert_rowid())
}

pub async fn get_all_admins(pool: &SqlitePool) -> Vec<Admin> {
    sqlx::query_as::<_, Admin>("SELECT * FROM admins ORDER BY id ASC")
        .fetch_all(pool)
        .await
        .unwrap_or_else(|e| { eprintln!("DB error fetching admins: {e}"); vec![] })
}

pub async fn update_admin_password(pool: &SqlitePool, id: i64, new_hash: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE admins SET password_hash = ? WHERE id = ?")
        .bind(new_hash)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete_admin(pool: &SqlitePool, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM admins WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
