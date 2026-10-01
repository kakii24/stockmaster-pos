use crate::db::DbConnection;
use crate::models::StockMovement;
use rusqlite::params;
use serde::Serialize;
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct StockValuation {
    pub total_items_count: i64,
    pub total_units_in_stock: f64,
    pub total_cost_value: f64,
    pub total_retail_value: f64,
    pub potential_profit: f64,
}

#[tauri::command]
pub fn add_stock_movement(
    product_id: String,
    movement_type: String, // 'reception', 'adjustment', 'loss', 'return'
    quantity: f64,
    reason: Option<String>,
    reference_doc: Option<String>,
    user_id: Option<String>,
    db: State<'_, DbConnection>,
) -> Result<StockMovement, String> {
    let mut conn = db.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let mut current_stock: f64 = 0.0;
    let res = tx.query_row(
        "SELECT current_stock FROM products WHERE id = ?1",
        params![product_id],
        |row| row.get(0),
    );

    match res {
        Ok(stock) => current_stock = stock,
        Err(e) => return Err(format!("Produit non trouvé: {}", e)),
    }

    let new_stock = match movement_type.as_str() {
        "reception" | "return" => current_stock + quantity,
        "loss" => current_stock - quantity,
        "adjustment" => quantity, // in adjustment mode, quantity is the counted physical stock
        _ => current_stock + quantity,
    };

    let delta_qty = new_stock - current_stock;

    // Update product stock
    tx.execute(
        "UPDATE products SET current_stock = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![new_stock, product_id],
    )
    .map_err(|e| e.to_string())?;

    let mov_id = format!("mov-{}", Uuid::new_v4().to_string().chars().take(8).collect::<String>());

    tx.execute(
        "INSERT INTO stock_movements (
            id, product_id, movement_type, quantity, previous_stock, new_stock,
            reason, reference_doc, user_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            mov_id,
            product_id,
            movement_type,
            delta_qty,
            current_stock,
            new_stock,
            reason,
            reference_doc,
            user_id,
        ],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(StockMovement {
        id: mov_id,
        product_id,
        product_name: None,
        movement_type,
        quantity: delta_qty,
        previous_stock: current_stock,
        new_stock,
        reason,
        reference_doc,
        user_id,
        user_name: None,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
pub fn get_stock_movements(
    product_id: Option<String>,
    limit: Option<i64>,
    db: State<'_, DbConnection>,
) -> Result<Vec<StockMovement>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let row_limit = limit.unwrap_or(100);

    let query = if let Some(_) = product_id {
        "SELECT sm.id, sm.product_id, p.name as product_name, sm.movement_type,
                sm.quantity, sm.previous_stock, sm.new_stock, sm.reason,
                sm.reference_doc, sm.user_id, u.name as user_name, sm.created_at
         FROM stock_movements sm
         LEFT JOIN products p ON sm.product_id = p.id
         LEFT JOIN users u ON sm.user_id = u.id
         WHERE sm.product_id = ?1
         ORDER BY sm.created_at DESC
         LIMIT ?2"
    } else {
        "SELECT sm.id, sm.product_id, p.name as product_name, sm.movement_type,
                sm.quantity, sm.previous_stock, sm.new_stock, sm.reason,
                sm.reference_doc, sm.user_id, u.name as user_name, sm.created_at
         FROM stock_movements sm
         LEFT JOIN products p ON sm.product_id = p.id
         LEFT JOIN users u ON sm.user_id = u.id
         ORDER BY sm.created_at DESC
         LIMIT ?1"
    };

    let mut movements = Vec::new();

    if let Some(pid) = product_id {
        let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![pid, row_limit], |row| {
                Ok(StockMovement {
                    id: row.get(0)?,
                    product_id: row.get(1)?,
                    product_name: row.get(2)?,
                    movement_type: row.get(3)?,
                    quantity: row.get(4)?,
                    previous_stock: row.get(5)?,
                    new_stock: row.get(6)?,
                    reason: row.get(7)?,
                    reference_doc: row.get(8)?,
                    user_id: row.get(9)?,
                    user_name: row.get(10)?,
                    created_at: row.get(11)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for r in rows {
            movements.push(r.map_err(|e| e.to_string())?);
        }
    } else {
        let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![row_limit], |row| {
                Ok(StockMovement {
                    id: row.get(0)?,
                    product_id: row.get(1)?,
                    product_name: row.get(2)?,
                    movement_type: row.get(3)?,
                    quantity: row.get(4)?,
                    previous_stock: row.get(5)?,
                    new_stock: row.get(6)?,
                    reason: row.get(7)?,
                    reference_doc: row.get(8)?,
                    user_id: row.get(9)?,
                    user_name: row.get(10)?,
                    created_at: row.get(11)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for r in rows {
            movements.push(r.map_err(|e| e.to_string())?);
        }
    }

    Ok(movements)
}

#[tauri::command]
pub fn get_stock_valuation(db: State<'_, DbConnection>) -> Result<StockValuation, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT COUNT(*),
                    COALESCE(SUM(current_stock), 0.0),
                    COALESCE(SUM(cost_price * current_stock), 0.0),
                    COALESCE(SUM(retail_price * current_stock), 0.0)
             FROM products
             WHERE is_active = 1",
        )
        .map_err(|e| e.to_string())?;

    let row = stmt
        .query_row([], |r| {
            let count: i64 = r.get(0)?;
            let units: f64 = r.get(1)?;
            let cost: f64 = r.get(2)?;
            let retail: f64 = r.get(3)?;
            let profit = retail - cost;
            Ok(StockValuation {
                total_items_count: count,
                total_units_in_stock: units,
                total_cost_value: cost,
                total_retail_value: retail,
                potential_profit: profit,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(row)
}
