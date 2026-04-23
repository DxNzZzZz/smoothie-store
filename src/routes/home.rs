use crate::models::smoothie;
use rocket::serde::json::Json;
use rocket::State;
use sqlx::SqlitePool;

#[get("/api/featured")]
pub async fn featured_smoothies(pool: &State<SqlitePool>) -> Json<Vec<smoothie::SmoothieWithMacros>> {
    let all = smoothie::get_all_with_macros(pool.inner()).await;
    let featured: Vec<_> = all.into_iter().take(3).collect();
    Json(featured)
}
