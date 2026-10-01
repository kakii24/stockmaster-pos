use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub barcode: String,
    pub name: String,
    pub category_id: Option<String>,
    pub category_name: Option<String>,
    pub cost_price: f64,
    pub retail_price: f64,
    pub wholesale_price: f64,
    pub min_wholesale_quantity: f64,
    pub current_stock: f64,
    pub min_stock_alert: f64,
    pub unit: String,
    pub tva_rate: f64,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub color: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub nis_nif: Option<String>,
    pub credit_limit: f64,
    pub current_debt: f64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockMovement {
    pub id: String,
    pub product_id: String,
    pub product_name: Option<String>,
    pub movement_type: String, // 'reception', 'sale', 'adjustment', 'loss', 'return'
    pub quantity: f64,
    pub previous_stock: f64,
    pub new_stock: f64,
    pub reason: Option<String>,
    pub reference_doc: Option<String>,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub created_at: String,
}
