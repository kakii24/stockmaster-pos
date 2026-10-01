use crate::db::DbConnection;
use crate::models::Customer;
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_customers(db: State<'_, DbConnection>) -> Result<Vec<Customer>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, phone, email, address, nis_nif, credit_limit, current_debt, created_at
             FROM customers
             ORDER BY name ASC",
        )
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                address: row.get(4)?,
                nis_nif: row.get(5)?,
                credit_limit: row.get(6)?,
                current_debt: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut customers = Vec::new();
    for c in iter {
        customers.push(c.map_err(|e| e.to_string())?);
    }
    Ok(customers)
}

#[tauri::command]
pub fn create_customer(customer: Customer, db: State<'_, DbConnection>) -> Result<Customer, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = if customer.id.is_empty() {
        format!("cust-{}", Uuid::new_v4().to_string().chars().take(8).collect::<String>())
    } else {
        customer.id.clone()
    };

    conn.execute(
        "INSERT INTO customers (id, name, phone, email, address, nis_nif, credit_limit, current_debt)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            id,
            customer.name,
            customer.phone,
            customer.email,
            customer.address,
            customer.nis_nif,
            customer.credit_limit,
            customer.current_debt,
        ],
    )
    .map_err(|e| e.to_string())?;

    let mut created = customer;
    created.id = id;
    Ok(created)
}

#[tauri::command]
pub fn update_customer(customer: Customer, db: State<'_, DbConnection>) -> Result<Customer, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE customers SET
            name = ?1, phone = ?2, email = ?3, address = ?4, nis_nif = ?5,
            credit_limit = ?6, current_debt = ?7
         WHERE id = ?8",
        params![
            customer.name,
            customer.phone,
            customer.email,
            customer.address,
            customer.nis_nif,
            customer.credit_limit,
            customer.current_debt,
            customer.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(customer)
}

#[tauri::command]
pub fn pay_customer_debt(
    customer_id: String,
    amount: f64,
    db: State<'_, DbConnection>,
) -> Result<f64, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE customers SET current_debt = MAX(0.0, current_debt - ?1) WHERE id = ?2",
        params![amount, customer_id],
    )
    .map_err(|e| e.to_string())?;

    let new_debt: f64 = conn
        .query_row(
            "SELECT current_debt FROM customers WHERE id = ?1",
            params![customer_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(new_debt)
}
