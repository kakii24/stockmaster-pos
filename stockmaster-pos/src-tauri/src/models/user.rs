use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub name: String,
    pub role: String, // 'admin', 'manager', 'cashier'
    pub is_active: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CashDrawerSession {
    pub id: String,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub opening_cash: f64,
    pub closing_cash: Option<f64>,
    pub expected_cash: Option<f64>,
    pub difference: Option<f64>,
    pub opened_at: String,
    pub closed_at: Option<String>,
    pub status: String, // 'open' or 'closed'
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoreSetting {
    pub key: String,
    pub value: String,
}
