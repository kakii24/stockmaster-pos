export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category_id?: string | null;
  category_name?: string | null;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  min_wholesale_quantity: number;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
  tva_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  nis_nif?: string | null;
  credit_limit: number;
  current_debt: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string | null;
  product_name: string;
  barcode: string;
  unit_price_ht: number;
  quantity: number;
  discount_percent: number;
  tva_rate: number;
  total_ht: number;
  total_ttc: number;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string | null;
  customer_name?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  sale_type: 'retail' | 'wholesale';
  subtotal_ht: number;
  discount_amount: number;
  tax_tva: number;
  timbre_fiscal: number;
  total_ttc: number;
  paid_amount: number;
  change_amount: number;
  payment_method: 'cash' | 'card' | 'check' | 'credit' | 'mixed';
  status: 'completed' | 'cancelled' | 'refunded';
  notes?: string | null;
  created_at: string;
  items: SaleItem[];
}

export interface CreateSaleItemInput {
  product_id?: string | null;
  product_name: string;
  barcode: string;
  unit_price_ht: number;
  quantity: number;
  discount_percent: number;
  tva_rate: number;
}

export interface CreateSaleInput {
  customer_id?: string | null;
  user_id?: string | null;
  sale_type: 'retail' | 'wholesale';
  discount_amount: number;
  timbre_fiscal: number;
  paid_amount: number;
  payment_method: 'cash' | 'card' | 'check' | 'credit' | 'mixed';
  notes?: string | null;
  items: CreateSaleItemInput[];
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string | null;
  movement_type: 'reception' | 'sale' | 'adjustment' | 'loss' | 'return';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string | null;
  reference_doc?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  created_at: string;
}

export interface StockValuation {
  total_items_count: number;
  total_units_in_stock: number;
  total_cost_value: number;
  total_retail_value: number;
  potential_profit: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  is_active: boolean;
  created_at: string;
}

export interface CashDrawerSession {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  opening_cash: number;
  closing_cash?: number | null;
  expected_cash?: number | null;
  difference?: number | null;
  opened_at: string;
  closed_at?: string | null;
  status: 'open' | 'closed';
}

export interface StoreSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_nif_nis: string;
  currency: 'DZD' | 'EUR';
  default_tva: number;
  enable_timbre_fiscal: boolean;
  timbre_fiscal_rate: number;
  timbre_fiscal_min: number;
  timbre_fiscal_max: number;
  printer_type: 'escpos_80mm' | 'escpos_58mm' | 'system';
  receipt_footer: string;
}

export interface CartItem {
  id: string; // product id or temp id
  product: Product;
  quantity: number;
  unit_price: number; // custom or mode price
  discount_percent: number;
  tva_rate: number;
}

export type ActiveView = 'pos' | 'inventory' | 'customers' | 'reports' | 'settings';
