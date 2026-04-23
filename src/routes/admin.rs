use rocket::http::{Cookie, CookieJar};
use rocket::request::{FromRequest, Outcome, Request};
use rocket::response::Redirect;
use rocket::serde::json::Json;
use rocket::State;
use rocket::{get, post};
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};

use crate::models::admin::{
    create_admin, delete_admin, get_admin_by_username, get_all_admins, update_admin_password, Admin,
};
use crate::models::order::{complete_order, get_pending_orders, OrderWithSmoothie};

#[derive(Serialize)]
pub struct AdminUser {
    pub id: i64,
    pub is_superadmin: bool,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AdminUser {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let pool = request.guard::<&State<SqlitePool>>().await.unwrap();

        if let Some(cookie) = request.cookies().get_private("admin_id") {
            if let Ok(id) = cookie.value().parse::<i64>() {
                if let Some(admin) = crate::models::admin::get_admin_by_id(pool, id).await {
                    return Outcome::Success(AdminUser {
                        id: admin.id,
                        is_superadmin: admin.is_superadmin,
                    });
                }
            }
        }
        Outcome::Forward(rocket::http::Status::Unauthorized)
    }
}

#[derive(Debug, Deserialize)]
pub struct LoginForm {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AdminAuthResponse {
    pub success: bool,
    pub error: Option<String>,
}

#[post("/api/admin/login", data = "<form>")]
pub async fn login_submit_api(
    pool: &State<SqlitePool>,
    cookies: &CookieJar<'_>,
    form: Json<LoginForm>,
) -> Json<AdminAuthResponse> {
    let Some(admin) = get_admin_by_username(pool, &form.username).await else {
        return Json(AdminAuthResponse {
            success: false,
            error: Some("Невалидно потребителско име или парола".to_string()),
        });
    };

    let stored = admin.password_hash.clone();
    let candidate = form.password.clone();

    let is_hashed = stored.starts_with("$2b$") || stored.starts_with("$2a$");

    let valid = if is_hashed {
        tokio::task::spawn_blocking(move || bcrypt::verify(&candidate, &stored))
            .await
            .ok()
            .and_then(|r| r.ok())
            .unwrap_or(false)
    } else {
        // Legacy plaintext — accept once and immediately upgrade
        candidate == stored
    };

    if !valid {
        return Json(AdminAuthResponse {
            success: false,
            error: Some("Невалидно потребителско име или парола".to_string()),
        });
    }

    // Upgrade plaintext to bcrypt hash transparently
    if !is_hashed {
        let to_hash = form.password.clone();
        if let Ok(Ok(new_hash)) =
            tokio::task::spawn_blocking(move || bcrypt::hash(to_hash, bcrypt::DEFAULT_COST)).await
        {
            let _ = update_admin_password(pool, admin.id, &new_hash).await;
        }
    }

    cookies.add_private(Cookie::new("admin_id", admin.id.to_string()));
    Json(AdminAuthResponse { success: true, error: None })
}

#[get("/api/admin/logout")]
pub fn logout_api(cookies: &CookieJar<'_>) -> Redirect {
    cookies.remove_private(Cookie::from("admin_id"));
    Redirect::to("/login")
}

#[derive(Serialize)]
pub struct DashboardData {
    orders: Vec<OrderWithSmoothie>,
    admins: Vec<Admin>,
    is_superadmin: bool,
}

#[get("/api/admin")]
pub async fn admin_dashboard_api(
    pool: &State<SqlitePool>,
    user: AdminUser,
) -> Json<DashboardData> {
    let pending_orders = get_pending_orders(pool).await;
    let admins = get_all_admins(pool).await;
    Json(DashboardData {
        orders: pending_orders,
        admins,
        is_superadmin: user.is_superadmin,
    })
}

#[derive(Serialize)]
pub struct AdminActionResponse {
    success: bool,
    error: Option<String>,
}

#[post("/api/admin/order/<id>/complete")]
pub async fn admin_complete_order_api(
    pool: &State<SqlitePool>,
    _user: AdminUser,
    id: i64,
) -> Json<AdminActionResponse> {
    match complete_order(pool, id).await {
        Ok(_) => Json(AdminActionResponse { success: true, error: None }),
        Err(e) => {
            eprintln!("Failed to complete order {id}: {e}");
            Json(AdminActionResponse {
                success: false,
                error: Some("Грешка при приключване на поръчката".to_string()),
            })
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct NewAdminForm {
    pub username: String,
    pub password: String,
    pub is_superadmin: Option<bool>,
}

#[post("/api/admin/new", data = "<form>")]
pub async fn admin_create_admin_api(
    pool: &State<SqlitePool>,
    user: AdminUser,
    form: Json<NewAdminForm>,
) -> Json<AdminActionResponse> {
    if !user.is_superadmin {
        return Json(AdminActionResponse {
            success: false,
            error: Some("Забранено".to_string()),
        });
    }

    let password = form.password.clone();
    let hashed = match tokio::task::spawn_blocking(move || {
        bcrypt::hash(password, bcrypt::DEFAULT_COST)
    })
    .await
    {
        Ok(Ok(h)) => h,
        _ => {
            return Json(AdminActionResponse {
                success: false,
                error: Some("Грешка при създаване на администратор".to_string()),
            })
        }
    };

    let is_super = form.is_superadmin.unwrap_or(false);
    match create_admin(pool, &form.username, &hashed, is_super).await {
        Ok(_) => Json(AdminActionResponse { success: true, error: None }),
        Err(e) => {
            eprintln!("Failed to create admin '{}': {e}", form.username);
            Json(AdminActionResponse {
                success: false,
                error: Some("Потребителското име вече съществува.".to_string()),
            })
        }
    }
}

#[post("/api/admin/delete/<id>")]
pub async fn admin_delete_admin_api(
    pool: &State<SqlitePool>,
    user: AdminUser,
    id: i64,
) -> Json<AdminActionResponse> {
    if !user.is_superadmin {
        return Json(AdminActionResponse {
            success: false,
            error: Some("Забранено".to_string()),
        });
    }

    if user.id == id {
        return Json(AdminActionResponse {
            success: false,
            error: Some("Не можете да изтриете собствения си акаунт.".to_string()),
        });
    }

    match delete_admin(pool, id).await {
        Ok(_) => Json(AdminActionResponse { success: true, error: None }),
        Err(e) => {
            eprintln!("Failed to delete admin {id}: {e}");
            Json(AdminActionResponse {
                success: false,
                error: Some("Грешка при изтриване на администратор".to_string()),
            })
        }
    }
}
