// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod hardware;
mod models;

use commands::*;
use db::{init_db, run_migrations};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();
            let db = init_db(Some(&app_handle)).expect("Failed to initialize SQLite database");
            
            // Run schema migrations and seed initial data
            {
                let conn = db.lock().expect("Failed to acquire database lock");
                run_migrations(&conn).expect("Failed to run database migrations");
            }

            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_products,
            get_product_by_barcode,
            create_product,
            update_product,
            delete_product,
            get_categories,
            create_sale,
            get_sales,
            add_stock_movement,
            get_stock_movements,
            get_stock_valuation,
            get_customers,
            create_customer,
            update_customer,
            pay_customer_debt,
            print_receipt_escpos,
            kick_cash_drawer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
