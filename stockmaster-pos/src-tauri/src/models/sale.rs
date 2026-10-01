use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleItem {
    pub id: String,
    pub sale_id: String,
    pub product_id: Option<String>,
    pub product_name: String,
    pub barcode: String,
    pub unit_price_ht: f64,
    pub quantity: f64,
    pub discount_percent: f64,
    pub tva_rate: f64,
    pub total_ht: f64,
    pub total_ttc: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sale {
    pub id: String,
    pub invoice_number: String,
    pub customer_id: Option<String>,
    pub customer_name: Option<String>,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub sale_type: String, // 'retail' or 'wholesale'
    pub subtotal_ht: f64,
    pub discount_amount: f64,
    pub tax_tva: f64,
    pub timbre_fiscal: f64,
    pub total_ttc: f64,
    pub paid_amount: f64,
    pub change_amount: f64,
    pub payment_method: String, // 'cash', 'card', 'check', 'credit', 'mixed'
    pub status: String,         // 'completed', 'cancelled', 'refunded'
    pub notes: Option<String>,
    pub created_at: String,
    pub items: Vec<SaleItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSaleItemInput {
    pub product_id: Option<String>,
    pub product_name: String,
    pub barcode: String,
    pub unit_price_ht: f64,
    pub quantity: f64,
    pub discount_percent: f64,
    pub tva_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSaleInput {
    pub customer_id: Option<String>,
    pub user_id: Option<String>,
    pub sale_type: String,
    pub discount_amount: f64,
    pub timbre_fiscal: f64,
    pub paid_amount: f64,
    pub payment_method: String,
    pub notes: Option<String>,
    pub items: Vec<CreateSaleItemInput>,
}
