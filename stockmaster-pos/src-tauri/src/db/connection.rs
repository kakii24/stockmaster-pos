use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

pub type DbConnection = Arc<Mutex<Connection>>;

pub fn init_db(app_handle: Option<&AppHandle>) -> Result<DbConnection, rusqlite::Error> {
    let db_path = if let Some(app) = app_handle {
        match app.path().app_data_dir() {
            Ok(mut dir) => {
                let _ = fs::create_dir_all(&dir);
                dir.push("stockmaster.db");
                dir
            }
            Err(_) => PathBuf::from("stockmaster.db"),
        }
    } else {
        PathBuf::from("stockmaster.db")
    };

    let conn = Connection::open(&db_path)?;

    // Enable WAL (Write-Ahead Logging) mode for high-concurrency desktop POS
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.pragma_update(None, "busy_timeout", 5000)?;

    Ok(Arc::new(Mutex::new(conn)))
}
