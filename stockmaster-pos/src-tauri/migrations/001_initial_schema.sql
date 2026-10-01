-- StockMaster POS Initial SQLite Schema
-- Optimized for SQLite with WAL mode

PRAGMA foreign_keys = ON;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    barcode TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    cost_price REAL NOT NULL DEFAULT 0.0,
    retail_price REAL NOT NULL,
    wholesale_price REAL NOT NULL,
    min_wholesale_quantity REAL NOT NULL DEFAULT 5.0,
    current_stock REAL NOT NULL DEFAULT 0.0,
    min_stock_alert REAL NOT NULL DEFAULT 5.0,
    unit TEXT NOT NULL DEFAULT 'U',
    tva_rate REAL NOT NULL DEFAULT 19.0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- 4. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    nis_nif TEXT,
    credit_limit REAL NOT NULL DEFAULT 50000.0,
    current_debt REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 5. Sales table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    sale_type TEXT NOT NULL DEFAULT 'retail' CHECK(sale_type IN ('retail', 'wholesale')),
    subtotal_ht REAL NOT NULL DEFAULT 0.0,
    discount_amount REAL NOT NULL DEFAULT 0.0,
    tax_tva REAL NOT NULL DEFAULT 0.0,
    timbre_fiscal REAL NOT NULL DEFAULT 0.0,
    total_ttc REAL NOT NULL,
    paid_amount REAL NOT NULL DEFAULT 0.0,
    change_amount REAL NOT NULL DEFAULT 0.0,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'check', 'credit', 'mixed')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'cancelled', 'refunded')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

-- 6. Sale Items table
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    barcode TEXT NOT NULL,
    unit_price_ht REAL NOT NULL,
    quantity REAL NOT NULL,
    discount_percent REAL NOT NULL DEFAULT 0.0,
    tva_rate REAL NOT NULL DEFAULT 19.0,
    total_ht REAL NOT NULL,
    total_ttc REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- 7. Stock Movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK(movement_type IN ('reception', 'sale', 'adjustment', 'loss', 'return')),
    quantity REAL NOT NULL,
    previous_stock REAL NOT NULL,
    new_stock REAL NOT NULL,
    reason TEXT,
    reference_doc TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- 8. Cash Drawer Sessions table
CREATE TABLE IF NOT EXISTS cash_drawer_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    opening_cash REAL NOT NULL DEFAULT 0.0,
    closing_cash REAL,
    expected_cash REAL,
    difference REAL,
    opened_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed'))
);

-- 9. Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insert Default Settings
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('store_name', 'STOCKMASTER DISTRIBUTION'),
    ('store_address', '12 Boulevard des Martyrs, Alger'),
    ('store_phone', '+213 21 00 00 00'),
    ('store_nif_nis', 'NIF: 099816001234567 | RC: 16/00-12345B'),
    ('currency', 'DZD'),
    ('default_tva', '19.0'),
    ('enable_timbre_fiscal', 'true'),
    ('timbre_fiscal_rate', '1.0'),
    ('timbre_fiscal_min', '10.0'),
    ('timbre_fiscal_max', '2500.0'),
    ('printer_type', 'escpos_80mm'),
    ('receipt_footer', 'Merci de votre visite et à bientôt !');

-- Insert Default Admin User (pass: admin123)
INSERT OR IGNORE INTO users (id, username, password_hash, name, role) VALUES
    ('usr-admin-1', 'admin', 'admin123', 'Administrateur Principal', 'admin'),
    ('usr-cashier-1', 'caissier', 'caisse123', 'Amina Caissière', 'cashier');

-- Insert Default Categories
INSERT OR IGNORE INTO categories (id, name, color) VALUES
    ('cat-1', 'Alimentation Générale', '#10b981'),
    ('cat-2', 'Boissons & Eaux', '#06b6d4'),
    ('cat-3', 'Produits d''Entretien', '#f59e0b'),
    ('cat-4', 'Quincaillerie & Électricité', '#8b5cf6'),
    ('cat-5', 'Hygiène & Beauté', '#ec4899');

-- Insert Starter Sample Products
INSERT OR IGNORE INTO products (id, barcode, name, category_id, cost_price, retail_price, wholesale_price, min_wholesale_quantity, current_stock, min_stock_alert, unit, tva_rate) VALUES
    ('prod-1', '613000100101', 'Huile Elio 5 Litres', 'cat-1', 580.0, 650.0, 620.0, 4.0, 24.0, 6.0, 'Bidon', 0.0),
    ('prod-2', '613000100102', 'Sucre Blanc En Poudre 1kg', 'cat-1', 85.0, 100.0, 92.0, 10.0, 120.0, 20.0, 'Kg', 0.0),
    ('prod-3', '613000100103', 'Eau Minérale Ifri 1.5L (Pack 6)', 'cat-2', 180.0, 230.0, 200.0, 5.0, 48.0, 10.0, 'Pack', 9.0),
    ('prod-4', '613000100104', 'Café Moulu Bonal 250g', 'cat-1', 190.0, 240.0, 215.0, 12.0, 60.0, 15.0, 'Paquet', 19.0),
    ('prod-5', '613000100105', 'Lessive Liquide OMO 3L', 'cat-3', 820.0, 980.0, 910.0, 3.0, 18.0, 4.0, 'Bouteille', 19.0),
    ('prod-6', '613000100106', 'Javel Express 1L', 'cat-3', 70.0, 90.0, 80.0, 12.0, 5.0, 10.0, 'Bouteille', 19.0),
    ('prod-7', '613000100107', 'Ampoule LED 15W E27 Blanc Froid', 'cat-4', 160.0, 220.0, 185.0, 10.0, 85.0, 15.0, 'Pièce', 19.0),
    ('prod-8', '613000100108', 'Shampooing Ultra Doux 400ml', 'cat-5', 310.0, 390.0, 350.0, 6.0, 32.0, 8.0, 'Flacon', 19.0);

-- Insert Starter Customers
INSERT OR IGNORE INTO customers (id, name, phone, email, address, nis_nif, credit_limit, current_debt) VALUES
    ('cust-walkin', 'Client Comptoir (Passager)', '', '', 'Vente direct en magasin', '', 0.0, 0.0),
    ('cust-1', 'Établissement Benali & Frères', '0550 12 34 56', 'contact@benali.dz', 'Zone Industrielle Oued Smar, Alger', 'NIF: 000116012345678', 150000.0, 14500.0),
    ('cust-2', 'Supérette El Hilal', '0661 98 76 54', 'elhilal.market@gmail.com', 'Bab Ezzouar, Alger', 'NIF: 099916098765432', 80000.0, 0.0);
