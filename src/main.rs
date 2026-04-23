#[macro_use]
extern crate rocket;

mod db;
mod models;
mod routes;

use rocket::fs::{FileServer, NamedFile};
use std::path::{Path, PathBuf};

#[get("/")]
async fn index() -> Option<NamedFile> {
    NamedFile::open(Path::new("static/html/index.html")).await.ok()
}

#[get("/<file..>", rank = 20)]
async fn html_pages(file: PathBuf) -> Option<NamedFile> {
    let mut path = PathBuf::from("static/html");
    path.push(&file);
    if path.is_dir() {
        return None;
    }
    
    // Auto-append .html if extension is missing
    if path.extension().is_none() {
        path.set_extension("html");
    }

    NamedFile::open(path).await.ok()
}

#[rocket::main]
async fn main() {
    let pool = db::init_pool().await;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run database migrations");

    let _ = rocket::build()
        .manage(pool)
        .mount(
            "/",
            routes![index, html_pages]
        )
        .mount(
            "/",
            routes![
                routes::home::featured_smoothies,
                routes::menu::menu_api,
                routes::menu::smoothie_detail_api,
                routes::order::order_post_api,
                routes::custom::builder_api,
                routes::custom::submit_custom_api,
                routes::admin::login_submit_api,
                routes::admin::logout_api,
                routes::admin::admin_dashboard_api,
                routes::admin::admin_complete_order_api,
                routes::admin::admin_create_admin_api,
                routes::admin::admin_delete_admin_api,
                routes::user::register_submit_api,
                routes::user::user_login_submit_api,
                routes::user::user_logout_api,
                routes::user::profile_api,
                routes::user::verify_auth_api,
            ],
        )
        .mount("/css", FileServer::from("static/css").rank(1))
        .mount("/js", FileServer::from("static/js").rank(1))
        .mount("/components", FileServer::from("static/components").rank(1))
        .launch()
        .await;
}
