# 🥤 BlendBar - Premium Smoothie Store

A modern, full-stack smoothie store application built with **Rust (Rocket)** and a sleek, premium frontend. This project features a custom smoothie builder, automated macro calculations, and a responsive glassmorphism UI.

## ✨ Features

- **Store Menu**: Browse a curated list of artisanal smoothies.
- **Custom Smoothie Builder**: Interactive tool to create your own blends with real-time calorie and macro tracking.
- **Member Profiles**: User authentication with order history and profile management.
- **Premium UI**: Modern aesthetics using glassmorphism, smooth animations, and perfect typography.
- **Localized**: Full support for Bulgarian language.

## 🛠️ Tech Stack

- **Backend**: [Rust](https://www.rust-lang.org/) with [Rocket](https://rocket.rs/)
- **Database**: [SQLite](https://www.sqlite.org/) with [SQLx](https://github.com/launchbadge/sqlx)
- **Frontend**: Vanilla HTML5, CSS3 (Modern Grid & Flexbox), Javascript (ES6+)
- **Styling**: Premium custom CSS with Glassmorphism effects

## 🚀 Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)
- [SQLx CLI](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli) (optional, for migrations)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/smoothie-store.git
   cd smoothie-store
   ```

2. **Setup environment variables**:

   ```bash
   cp .env.example .env
   ```

3. **Initialize the database**:
   The application will automatically use `smoothies.db`. If you have the SQLx CLI installed, you can run:

   ```bash
   sqlx db create
   sqlx migrate run
   ```

4. **Run the application**:
   ```bash
   cargo run
   ```
   The server will start at `http://localhost:8000`.

## 📂 Project Structure

- `/src`: Rust source code (routes, database logic, models).
- `/static`: Frontend assets (HTML, CSS, JS, Components).
- `/migrations`: SQL database schema migrations.
- `Rocket.toml`: Framework configuration.
