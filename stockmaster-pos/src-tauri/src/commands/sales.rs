use crate::db::DbConnection;
use crate::models::{CreateSaleInput, Sale, SaleItem};
use chrono::Local;
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn create_sale(
    sale_input: CreateSaleInput,
    db: State<'_, DbConnection>,
) -> Result<Sale, String> {
    let mut conn = db.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let sale_id = format!("sale-{}", Uuid::new_v4().to_string().chars().take(8).collect::<String>());
    let now = Local::now();
    let invoice_number = format!("FAC-{}-{}", now.format("%Y%m%d"), now.format("%H%M%S"));

    // Calculate totals
    let mut subtotal_ht = 0.0;
    let mut total_tva = 0.0;
    let mut items_to_insert = Vec::new();

    for item in &sale_input.items {
        let line_ht = (item.unit_price_ht * item.quantity) * (1.0 - item.discount_percent / 100.0);
        let line_tva = line_ht * (item.tva_rate / 100.0);
        let line_ttc = line_ht + line_tva;

        subtotal_ht += line_ht;
        total_tva += line_tva;

        let item_id = format!("item-{}", Uuid::new_v4().to_string().chars().take(8).collect::<String>());
        items_to_insert.push(SaleItem {
            id: item_id,
            sale_id: sale_id.clone(),
            product_id: item.product_id.clone(),
            product_name: item.product_name.clone(),
            barcode: item.barcode.clone(),
            unit_price_ht: item.unit_price_ht,
            quantity: item.quantity,
            discount_percent: item.discount_percent,
            tva_rate: item.tva_rate,
            total_ht: line_ht,
            total_ttc: line_ttc,
        });
    }

    let subtotal_after_discount = (subtotal_ht - sale_input.discount_amount).max(0.0);
    let total_ttc = subtotal_after_discount + total_tva + sale_input.timbre_fiscal;
    let change_amount = (sale_input.paid_amount - total_ttc).max(0.0);

    // 1. Insert into sales
    tx.execute(
        "INSERT INTO sales (
            id, invoice_number, customer_id, user_id, sale_type,
            subtotal_ht, discount_amount, tax_tva, timbre_fiscal, total_ttc,
            paid_amount, change_amount, payment_method, status, notes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'completed', ?14)",
        params![
            sale_id,
            invoice_number,
            sale_input.customer_id,
            sale_input.user_id,
            sale_input.sale_type,
            subtotal_ht,
            sale_input.discount_amount,
            total_tva,
            sale_input.timbre_fiscal,
            total_ttc,
            sale_input.paid_amount,
            change_amount,
            sale_input.payment_method,
            sale_input.notes,
        ],
    )
    .map_err(|e| e.to_string())?;

    // 2. Insert items and decrement stock
    for item in &items_to_insert {
        tx.execute(
            "INSERT INTO sale_items (
                id, sale_id, product_id, product_name, barcode,
                unit_price_ht, quantity, discount_percent, tva_rate,
                total_ht, total_ttc
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                item.id,
                item.sale_id,
                item.product_id,
                item.product_name,
                item.barcode,
                item.unit_price_ht,
                item.quantity,
                item.discount_percent,
                item.tva_rate,
                item.total_ht,
                item.total_ttc,
            ],
        )
        .map_err(|e| e.to_string())?;

        // Decrement product stock if product_id is valid
        if let Some(ref prod_id) = item.product_id {
            let mut current_stock: f64 = 0.0;
            let res = tx.query_row(
                "SELECT current_stock FROM products WHERE id = ?1",
                params![prod_id],
                |row| row.get(0),
            );

            if let Ok(stock) = res {
                current_stock = stock;
                let new_stock = current_stock - item.quantity;
                tx.execute(
                    "UPDATE products SET current_stock = ?1, updated_at = datetime('now') WHERE id = ?2",
                    params![new_stock, prod_id],
                )
                .map_err(|e| e.to_string())?;

                // Record stock movement
                let mov_id = format!("mov-{}", Uuid::new_v4().to_string().chars().take(8).collect::<String>());
                tx.execute(
                    "INSERT INTO stock_movements (
                        id, product_id, movement_type, quantity, previous_stock, new_stock,
                        reason, reference_doc, user_id
                    ) VALUES (?1, ?2, 'sale', ?3, ?4, ?5, 'Vente en caisse', ?6, ?7)",
                    params![
                        mov_id,
                        prod_id,
                        -item.quantity,
                        current_stock,
                        new_stock,
                        invoice_number,
                        sale_input.user_id,
                    ],
                )
                .map_err(|e| e.to_string())?;
            }
        }
    }

    // 3. Handle credit sale
    if sale_input.payment_method == "credit" {
        if let Some(ref cust_id) = sale_input.customer_id {
            let unpaid = total_ttc - sale_input.paid_amount;
            if unpaid > 0.0 {
                tx.execute(
                    "UPDATE customers SET current_debt = current_debt + ?1 WHERE id = ?2",
                    params![unpaid, cust_id],
                )
                .map_err(|e| e.to_string())?;
            }
        }
    }

    // Get customer name for return object
    let customer_name: Option<String> = if let Some(ref cid) = sale_input.customer_id {
        tx.query_row(
            "SELECT name FROM customers WHERE id = ?1",
            params![cid],
            |r| r.get(0),
        )
        .ok()
    } else {
        None
    };

    tx.commit().map_err(|e| e.to_string())?;

    Ok(Sale {
        id: sale_id,
        invoice_number,
        customer_id: sale_input.customer_id,
        customer_name,
        user_id: sale_input.user_id,
        user_name: Some("Caissier".to_string()),
        sale_type: sale_input.sale_type,
        subtotal_ht,
        discount_amount: sale_input.discount_amount,
        tax_tva: total_tva,
        timbre_fiscal: sale_input.timbre_fiscal,
        total_ttc,
        paid_amount: sale_input.paid_amount,
        change_amount,
        payment_method: sale_input.payment_method,
        status: "completed".to_string(),
        notes: sale_input.notes,
        created_at: now.to_rfc3339(),
        items: items_to_insert,
    })
}

#[tauri::command]
pub fn get_sales(limit: Option<i64>, db: State<'_, DbConnection>) -> Result<Vec<Sale>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let row_limit = limit.unwrap_or(100);

    let mut stmt = conn
        .prepare(
            "SELECT s.id, s.invoice_number, s.customer_id, c.name as customer_name,
                    s.user_id, u.name as user_name, s.sale_type, s.subtotal_ht,
                    s.discount_amount, s.tax_tva, s.timbre_fiscal, s.total_ttc,
                    s.paid_amount, s.change_amount, s.payment_method, s.status,
                    s.notes, s.created_at
             FROM sales s
             LEFT JOIN customers c ON s.customer_id = c.id
             LEFT JOIN users u ON s.user_id = u.id
             ORDER BY s.created_at DESC
             LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

    let sale_iter = stmt
        .query_map(params![row_limit], |row| {
            Ok(Sale {
                id: row.get(0)?,
                invoice_number: row.get(1)?,
                customer_id: row.get(2)?,
                customer_name: row.get(3)?,
                user_id: row.get(4)?,
                user_name: row.get(5)?,
                sale_type: row.get(6)?,
                subtotal_ht: row.get(7)?,
                discount_amount: row.get(8)?,
                tax_tva: row.get(9)?,
                timbre_fiscal: row.get(10)?,
                total_ttc: row.get(11)?,
                paid_amount: row.get(12)?,
                change_amount: row.get(13)?,
                payment_method: row.get(14)?,
                status: row.get(15)?,
                notes: row.get(16)?,
                created_at: row.get(17)?,
                items: Vec::new(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut sales = Vec::new();
    for s in sale_iter {
        let mut sale = s.map_err(|e| e.to_string())?;
        // Fetch items
        let mut item_stmt = conn
            .prepare(
                "SELECT id, sale_id, product_id, product_name, barcode, unit_price_ht,
                        quantity, discount_percent, tva_rate, total_ht, total_ttc
                 FROM sale_items WHERE sale_id = ?1",
            )
            .map_err(|e| e.to_string())?;

        let items = item_stmt
            .query_map(params![sale.id], |r| {
                Ok(SaleItem {
                    id: r.get(0)?,
                    sale_id: r.get(1)?,
                    product_id: r.get(2)?,
                    product_name: r.get(3)?,
                    barcode: r.get(4)?,
                    unit_price_ht: r.get(5)?,
                    quantity: r.get(6)?,
                    discount_percent: r.get(7)?,
                    tva_rate: r.get(8)?,
                    total_ht: r.get(9)?,
                    total_ttc: r.get(10)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for item in items {
            sale.items.push(item.map_err(|e| e.to_string())?);
        }
        sales.push(sale);
    }

    Ok(sales)
}
