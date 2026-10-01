use crate::db::DbConnection;
use crate::models::{Category, Product};
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_products(db: State<'_, DbConnection>) -> Result<Vec<Product>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.barcode, p.name, p.category_id, c.name as category_name,
                    p.cost_price, p.retail_price, p.wholesale_price, p.min_wholesale_quantity,
                    p.current_stock, p.min_stock_alert, p.unit, p.tva_rate, p.is_active,
                    p.created_at, p.updated_at
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.is_active = 1
             ORDER BY p.name ASC",
        )
        .map_err(|e| e.to_string())?;

    let product_iter = stmt
        .query_map([], |row| {
            Ok(Product {
                id: row.get(0)?,
                barcode: row.get(1)?,
                name: row.get(2)?,
                category_id: row.get(3)?,
                category_name: row.get(4)?,
                cost_price: row.get(5)?,
                retail_price: row.get(6)?,
                wholesale_price: row.get(7)?,
                min_wholesale_quantity: row.get(8)?,
                current_stock: row.get(9)?,
                min_stock_alert: row.get(10)?,
                unit: row.get(11)?,
                tva_rate: row.get(12)?,
                is_active: row.get::<_, i32>(13)? == 1,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut products = Vec::new();
    for prod in product_iter {
        products.push(prod.map_err(|e| e.to_string())?);
    }
    Ok(products)
}

#[tauri::command]
pub fn get_product_by_barcode(
    barcode: String,
    db: State<'_, DbConnection>,
) -> Result<Option<Product>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.barcode, p.name, p.category_id, c.name as category_name,
                    p.cost_price, p.retail_price, p.wholesale_price, p.min_wholesale_quantity,
                    p.current_stock, p.min_stock_alert, p.unit, p.tva_rate, p.is_active,
                    p.created_at, p.updated_at
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.barcode = ?1 AND p.is_active = 1
             LIMIT 1",
        )
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query(params![barcode]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(Product {
            id: row.get(0).map_err(|e| e.to_string())?,
            barcode: row.get(1).map_err(|e| e.to_string())?,
            name: row.get(2).map_err(|e| e.to_string())?,
            category_id: row.get(3).map_err(|e| e.to_string())?,
            category_name: row.get(4).map_err(|e| e.to_string())?,
            cost_price: row.get(5).map_err(|e| e.to_string())?,
            retail_price: row.get(6).map_err(|e| e.to_string())?,
            wholesale_price: row.get(7).map_err(|e| e.to_string())?,
            min_wholesale_quantity: row.get(8).map_err(|e| e.to_string())?,
            current_stock: row.get(9).map_err(|e| e.to_string())?,
            min_stock_alert: row.get(10).map_err(|e| e.to_string())?,
            unit: row.get(11).map_err(|e| e.to_string())?,
            tva_rate: row.get(12).map_err(|e| e.to_string())?,
            is_active: row.get::<_, i32>(13).map_err(|e| e.to_string())? == 1,
            created_at: row.get(14).map_err(|e| e.to_string())?,
            updated_at: row.get(15).map_err(|e| e.to_string())?,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn create_product(
    product: Product,
    db: State<'_, DbConnection>,
) -> Result<Product, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = if product.id.is_empty() {
        format!("prod-{}", Uuid::new_v4().to_string().chars().take(8).collect::<String>())
    } else {
        product.id.clone()
    };

    conn.execute(
        "INSERT INTO products (
            id, barcode, name, category_id, cost_price, retail_price,
            wholesale_price, min_wholesale_quantity, current_stock,
            min_stock_alert, unit, tva_rate, is_active
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            id,
            product.barcode,
            product.name,
            product.category_id,
            product.cost_price,
            product.retail_price,
            product.wholesale_price,
            product.min_wholesale_quantity,
            product.current_stock,
            product.min_stock_alert,
            product.unit,
            product.tva_rate,
            if product.is_active { 1 } else { 0 },
        ],
    )
    .map_err(|e| e.to_string())?;

    let mut created = product;
    created.id = id;
    Ok(created)
}

#[tauri::command]
pub fn update_product(
    product: Product,
    db: State<'_, DbConnection>,
) -> Result<Product, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE products SET
            barcode = ?1, name = ?2, category_id = ?3, cost_price = ?4,
            retail_price = ?5, wholesale_price = ?6, min_wholesale_quantity = ?7,
            current_stock = ?8, min_stock_alert = ?9, unit = ?10, tva_rate = ?11,
            is_active = ?12, updated_at = datetime('now')
         WHERE id = ?13",
        params![
            product.barcode,
            product.name,
            product.category_id,
            product.cost_price,
            product.retail_price,
            product.wholesale_price,
            product.min_wholesale_quantity,
            product.current_stock,
            product.min_stock_alert,
            product.unit,
            product.tva_rate,
            if product.is_active { 1 } else { 0 },
            product.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(product)
}

#[tauri::command]
pub fn delete_product(id: String, db: State<'_, DbConnection>) -> Result<bool, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    // Soft delete to protect sales history
    conn.execute(
        "UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn get_categories(db: State<'_, DbConnection>) -> Result<Vec<Category>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, color, created_at FROM categories ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let cat_iter = stmt
        .query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut categories = Vec::new();
    for cat in cat_iter {
        categories.push(cat.map_err(|e| e.to_string())?);
    }
    Ok(categories)
}
