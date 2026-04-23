use crate::models::{
    order::{create_order, OrderForm},
};
use rocket::{
    serde::json::Json,
    State,
};
use sqlx::SqlitePool;
use serde::Serialize;

#[derive(Serialize)]
pub struct OrderResponse {
    pub success: bool,
    pub message: String,
}

#[post("/api/order", data = "<form>")]
pub async fn order_post_api(
    pool: &State<SqlitePool>,
    form: Json<OrderForm>,
    request_user: crate::routes::user::OptionalRegularUser,
) -> Json<OrderResponse> {
    let fallback_name = request_user.0.as_ref().map(|u| u.full_name.clone());
    let user_id = request_user.0.as_ref().map(|u| u.id);
    let final_name = form.customer_name.clone().or_else(|| fallback_name.clone()).unwrap_or_else(|| "Гост".to_string());

    match create_order(pool.inner(), &form.into_inner(), user_id, fallback_name).await {
        Ok(_) => Json(OrderResponse {
            success: true,
            message: format!("Поръчката е приета за {}! Готова след ~5 минути 🥤", final_name),
        }),
        Err(_) => Json(OrderResponse {
            success: false,
            message: "Възникна грешка. Моля, опитайте отново.".to_string(),
        }),
    }
}
