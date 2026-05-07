use rocket::serde::json::Json;
use rocket::State;
use rocket::{get, post};
use serde::Serialize;
use sqlx::SqlitePool;
use std::collections::HashMap;

use crate::models::smoothie::{get_all_ingredients, Ingredient};

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct CustomOrderFormLocal {
    pub customer_name: Option<String>,
    pub size: String,
    pub liquid_id: i64,
    pub ingredients: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct CustomIngredient {
    pub id: i64,
    pub grams: f64,
}

#[derive(Serialize)]
pub struct BuilderData {
    fruits: Vec<Ingredient>,
    liquids: Vec<Ingredient>,
}

#[get("/api/custom")]
pub async fn builder_api(pool: &State<SqlitePool>) -> Json<BuilderData> {
    let all_ingredients = get_all_ingredients(pool).await;
    let fruits: Vec<Ingredient> = all_ingredients
        .iter()
        .filter(|i| !i.is_liquid)
        .cloned()
        .collect();
    let liquids: Vec<Ingredient> = all_ingredients
        .iter()
        .filter(|i| i.is_liquid)
        .cloned()
        .collect();
    Json(BuilderData { fruits, liquids })
}

#[derive(Serialize)]
pub struct CustomOrderResponse {
    pub success: bool,
    pub message: String,
    pub smoothie_id: Option<i64>,
}

#[post("/api/custom", data = "<form>")]
pub async fn submit_custom_api(
    pool: &State<SqlitePool>,
    form: Json<CustomOrderFormLocal>,
    request_user: crate::routes::user::OptionalRegularUser,
) -> Json<CustomOrderResponse> {
    // Reject malformed ingredient JSON immediately
    let raw_ingredients: Vec<CustomIngredient> = match serde_json::from_str(&form.ingredients) {
        Ok(v) => v,
        Err(_) => {
            return Json(CustomOrderResponse {
                success: false,
                message: "Невалидни съставки.".to_string(),
                smoothie_id: None,
            })
        }
    };

    if raw_ingredients.is_empty() {
        return Json(CustomOrderResponse {
            success: false,
            message: "Моля изберете поне една съставка.".to_string(),
            smoothie_id: None,
        });
    }

    // Size rules: Small 400g (max 300g fruit), Medium 600g (max 450g), Large 800g (max 600g)
    let (total_g, max_fruit_g) = match form.size.as_str() {
        "small" => (400.0_f64, 300.0_f64),
        "medium" => (600.0_f64, 450.0_f64),
        "large" => (800.0_f64, 600.0_f64),
        _ => {
            return Json(CustomOrderResponse {
                success: false,
                message: "Невалиден размер.".to_string(),
                smoothie_id: None,
            })
        }
    };

    let fruit_entries: Vec<(i64, f64)> = raw_ingredients
        .into_iter()
        .map(|ci| (ci.id, ci.grams))
        .filter(|(_, g)| *g > 0.0)
        .collect();

    let total_fruit_g: f64 = fruit_entries.iter().map(|(_, g)| g).sum();

    if total_fruit_g > max_fruit_g {
        return Json(CustomOrderResponse {
            success: false,
            message: format!(
                "Общото тегло на плодовете ({:.0}г) надвишава лимита за размер {:.0}г.",
                total_fruit_g, max_fruit_g
            ),
            smoothie_id: None,
        });
    }

    let liquid_grams = total_g - total_fruit_g;
    let mut actual_ingredients = fruit_entries;
    actual_ingredients.push((form.liquid_id, liquid_grams));

    // Build price map
    let all_db = get_all_ingredients(pool).await;
    let price_map: HashMap<i64, f64> = all_db.iter().map(|i| (i.id, i.price_per_100g)).collect();

    let mut total_price = 0.0_f64;
    for (id, g) in &actual_ingredients {
        if let Some(price_per_100) = price_map.get(id) {
            total_price += (g / 100.0) * price_per_100;
        }
    }
    total_price *= 1.1; // 10% custom premium
    let rounded_price = (total_price * 100.0).round() / 100.0;

    let fallback_name = request_user.0.as_ref().map(|u| u.full_name.clone());
    let final_name = form
        .customer_name
        .clone()
        .or_else(|| fallback_name)
        .unwrap_or_else(|| "Гост".to_string());

    let smoothie_name = format!("Персонализирана смес от {}", final_name);

    // Transaction covers smoothie creation and ingredients
    let mut tx = match pool.begin().await {
        Ok(t) => t,
        Err(e) => {
            eprintln!("Failed to start transaction: {e}");
            return Json(CustomOrderResponse {
                success: false,
                message: "Грешка при създаване на смути.".to_string(),
                smoothie_id: None,
            });
        }
    };

    let smoothie_id = match sqlx::query(
        "INSERT INTO smoothies (name, description, price, tags, is_custom) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&smoothie_name)
    .bind("Персонализирана смес, приготвена от клиент.")
    .bind(rounded_price)
    .bind("custom")
    .bind(true)
    .execute(&mut *tx)
    .await
    {
        Ok(r) => r.last_insert_rowid(),
        Err(e) => {
            eprintln!("Failed to insert custom smoothie: {e}");
            let _ = tx.rollback().await;
            return Json(CustomOrderResponse {
                success: false,
                message: "Грешка при създаване на смути.".to_string(),
                smoothie_id: None,
            });
        }
    };

    for (fruit_id, grams) in &actual_ingredients {
        if let Err(e) = sqlx::query(
            "INSERT INTO smoothie_fruits (smoothie_id, fruit_id, grams) VALUES (?, ?, ?)",
        )
        .bind(smoothie_id)
        .bind(fruit_id)
        .bind(grams)
        .execute(&mut *tx)
        .await
        {
            eprintln!("Failed to insert smoothie ingredient: {e}");
            let _ = tx.rollback().await;
            return Json(CustomOrderResponse {
                success: false,
                message: "Грешка при запис на съставките.".to_string(),
                smoothie_id: None,
            });
        }
    }

    match tx.commit().await {
        Ok(_) => Json(CustomOrderResponse {
            success: true,
            message: "Смутито е създадено! Добавяме го в количката...".to_string(),
            smoothie_id: Some(smoothie_id),
        }),
        Err(e) => {
            eprintln!("Transaction commit failed: {e}");
            Json(CustomOrderResponse {
                success: false,
                message: "Грешка при записване на смутито.".to_string(),
                smoothie_id: None,
            })
        }
    }
}
