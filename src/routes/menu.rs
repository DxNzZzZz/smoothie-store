use crate::models::smoothie;
use rocket::serde::json::Json;
use rocket::State;
use sqlx::SqlitePool;
use serde::Serialize;

#[get("/api/menu")]
pub async fn menu_api(pool: &State<SqlitePool>) -> Json<Vec<smoothie::SmoothieWithMacros>> {
    let smoothies = smoothie::get_all_with_macros(pool.inner()).await;
    Json(smoothies)
}

#[derive(Serialize)]
pub struct SmoothieDetailResponse {
    smoothie: smoothie::SmoothieWithMacros,
    fruits: Vec<smoothie::Fruit>,
}

#[get("/api/menu/<id>")]
pub async fn smoothie_detail_api(pool: &State<SqlitePool>, id: i64) -> Option<Json<SmoothieDetailResponse>> {
    let s = smoothie::get_by_id(pool.inner(), id).await?;
    let fruits = smoothie::get_fruits_for_smoothie(pool.inner(), id).await;
    Some(Json(SmoothieDetailResponse {
        smoothie: s,
        fruits,
    }))
}
