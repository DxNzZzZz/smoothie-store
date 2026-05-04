use rocket::http::{Cookie, CookieJar};
use rocket::request::{FromRequest, Outcome, Request};
use rocket::response::Redirect;
use rocket::serde::json::Json;
use rocket::State;
use rocket::{get, post};
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};

use crate::models::order::{get_user_orders, UserOrderDetail};
use crate::models::user::{create_user, get_user_by_email, get_user_by_id, update_user_password};

#[derive(Serialize)]
pub struct RegularUser {
    pub id: i64,
    pub full_name: String,
    pub email: String,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for RegularUser {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let pool = request.guard::<&State<SqlitePool>>().await.unwrap();

        if let Some(cookie) = request.cookies().get_private("user_id") {
            if let Ok(id) = cookie.value().parse::<i64>() {
                if let Some(user) = get_user_by_id(pool.inner(), id).await {
                    return Outcome::Success(RegularUser {
                        id: user.id,
                        full_name: user.full_name,
                        email: user.email,
                    });
                }
            }
        }
        Outcome::Forward(rocket::http::Status::Unauthorized)
    }
}

pub struct OptionalRegularUser(pub Option<RegularUser>);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for OptionalRegularUser {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        match RegularUser::from_request(request).await {
            Outcome::Success(user) => Outcome::Success(OptionalRegularUser(Some(user))),
            _ => Outcome::Success(OptionalRegularUser(None)),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct RegisterForm {
    pub email: String,
    pub password: String,
    pub full_name: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    success: bool,
    error: Option<String>,
}

#[post("/api/register", data = "<form>")]
pub async fn register_submit_api(
    pool: &State<SqlitePool>,
    cookies: &CookieJar<'_>,
    form: Json<RegisterForm>,
) -> Json<AuthResponse> {
    let password = form.password.clone();
    let hashed = match tokio::task::spawn_blocking(move || {
        bcrypt::hash(password, bcrypt::DEFAULT_COST)
    })
    .await
    {
        Ok(Ok(h)) => h,
        _ => {
            return Json(AuthResponse {
                success: false,
                error: Some("Грешка при регистрация.".to_string()),
            })
        }
    };

    match create_user(pool, &form.email, &hashed, &form.full_name).await {
        Ok(id) => {
            cookies.add_private(Cookie::new("user_id", id.to_string()));
            Json(AuthResponse { success: true, error: None })
        }
        Err(_) => Json(AuthResponse {
            success: false,
            error: Some("Имейлът вече съществува или данните са невалидни.".to_string()),
        }),
    }
}

#[derive(Debug, Deserialize)]
pub struct UserLoginForm {
    pub email: String,
    pub password: String,
}

#[post("/api/user_login", data = "<form>")]
pub async fn user_login_submit_api(
    pool: &State<SqlitePool>,
    cookies: &CookieJar<'_>,
    form: Json<UserLoginForm>,
) -> Json<AuthResponse> {
    let Some(user) = get_user_by_email(pool, &form.email).await else {
        return Json(AuthResponse {
            success: false,
            error: Some("Невалиден имейл или парола".to_string()),
        });
    };

    let stored = user.password.clone();
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
        return Json(AuthResponse {
            success: false,
            error: Some("Невалиден имейл или парола".to_string()),
        });
    }

    // Upgrade plaintext to bcrypt hash transparently
    if !is_hashed {
        let to_hash = form.password.clone();
        if let Ok(Ok(new_hash)) =
            tokio::task::spawn_blocking(move || bcrypt::hash(to_hash, bcrypt::DEFAULT_COST)).await
        {
            let _ = update_user_password(pool, user.id, &new_hash).await;
        }
    }

    cookies.add_private(Cookie::new("user_id", user.id.to_string()));
    Json(AuthResponse { success: true, error: None })
}

#[get("/api/user_logout")]
pub fn user_logout_api(cookies: &CookieJar<'_>) -> Redirect {
    cookies.remove_private(Cookie::from("user_id"));
    Redirect::to("/")
}

#[derive(Serialize)]
pub struct ProfileData {
    user: RegularUser,
    orders: Vec<UserOrderDetail>,
}

#[get("/api/profile")]
pub async fn profile_api(pool: &State<SqlitePool>, user: RegularUser) -> Json<ProfileData> {
    let orders = get_user_orders(pool, user.id).await;
    Json(ProfileData { user, orders })
}

#[get("/api/auth/me")]
pub async fn verify_auth_api(user: OptionalRegularUser) -> Json<Option<RegularUser>> {
    Json(user.0)
}
