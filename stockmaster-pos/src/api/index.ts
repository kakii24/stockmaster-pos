import {
  Category,
  CreateSaleInput,
  Customer,
  Product,
  Sale,
  StockMovement,
  StockValuation,
} from '../types';

// Detect whether running inside Tauri Desktop or Browser
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Fallback in-memory storage for web browser dev & testing
const STORAGE_PREFIX = 'stockmaster_';

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

// Initial Demo Categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentation Générale', color: '#10b981', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Boissons & Eaux', color: '#06b6d4', created_at: new Date().toISOString() },
  { id: 'cat-3', name: "Produits d'Entretien", color: '#f59e0b', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Quincaillerie & Élec', color: '#8b5cf6', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Hygiène & Beauté', color: '#ec4899', created_at: new Date().toISOString() },
];

// Initial Demo Products
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    barcode: '613000100101',
    name: 'Huile Elio 5 Litres',
    category_id: 'cat-1',
    category_name: 'Alimentation Générale',
    cost_price: 580.0,
    retail_price: 650.0,
    wholesale_price: 620.0,
    min_wholesale_quantity: 4.0,
    current_stock: 24.0,
    min_stock_alert: 6.0,
    unit: 'Bidon',
    tva_rate: 0.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    barcode: '613000100102',
    name: 'Sucre Blanc En Poudre 1kg',
    category_id: 'cat-1',
    category_name: 'Alimentation Générale',
    cost_price: 85.0,
    retail_price: 100.0,
    wholesale_price: 92.0,
    min_wholesale_quantity: 10.0,
    current_stock: 120.0,
    min_stock_alert: 20.0,
    unit: 'Kg',
    tva_rate: 0.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    barcode: '613000100103',
    name: 'Eau Minérale Ifri 1.5L (Pack 6)',
    category_id: 'cat-2',
    category_name: 'Boissons & Eaux',
    cost_price: 180.0,
    retail_price: 230.0,
    wholesale_price: 200.0,
    min_wholesale_quantity: 5.0,
    current_stock: 48.0,
    min_stock_alert: 10.0,
    unit: 'Pack',
    tva_rate: 9.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    barcode: '613000100104',
    name: 'Café Moulu Bonal 250g',
    category_id: 'cat-1',
    category_name: 'Alimentation Générale',
    cost_price: 190.0,
    retail_price: 240.0,
    wholesale_price: 215.0,
    min_wholesale_quantity: 12.0,
    current_stock: 60.0,
    min_stock_alert: 15.0,
    unit: 'Paquet',
    tva_rate: 19.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    barcode: '613000100105',
    name: 'Lessive Liquide OMO 3L',
    category_id: 'cat-3',
    category_name: "Produits d'Entretien",
    cost_price: 820.0,
    retail_price: 980.0,
    wholesale_price: 910.0,
    min_wholesale_quantity: 3.0,
    current_stock: 18.0,
    min_stock_alert: 4.0,
    unit: 'Bouteille',
    tva_rate: 19.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    barcode: '613000100106',
    name: 'Javel Express 1L',
    category_id: 'cat-3',
    category_name: "Produits d'Entretien",
    cost_price: 70.0,
    retail_price: 90.0,
    wholesale_price: 80.0,
    min_wholesale_quantity: 12.0,
    current_stock: 5.0,
    min_stock_alert: 10.0,
    unit: 'Bouteille',
    tva_rate: 19.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    barcode: '613000100107',
    name: 'Ampoule LED 15W E27 Blanc Froid',
    category_id: 'cat-4',
    category_name: 'Quincaillerie & Élec',
    cost_price: 160.0,
    retail_price: 220.0,
    wholesale_price: 185.0,
    min_wholesale_quantity: 10.0,
    current_stock: 85.0,
    min_stock_alert: 15.0,
    unit: 'Pièce',
    tva_rate: 19.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    barcode: '613000100108',
    name: 'Shampooing Ultra Doux 400ml',
    category_id: 'cat-5',
    category_name: 'Hygiène & Beauté',
    cost_price: 310.0,
    retail_price: 390.0,
    wholesale_price: 350.0,
    min_wholesale_quantity: 6.0,
    current_stock: 32.0,
    min_stock_alert: 8.0,
    unit: 'Flacon',
    tva_rate: 19.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Initial Demo Customers
const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-walkin',
    name: 'Client Comptoir (Passager)',
    phone: '',
    email: '',
    address: 'Vente directe en magasin',
    nis_nif: '',
    credit_limit: 0,
    current_debt: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cust-1',
    name: 'Établissement Benali & Frères',
    phone: '0550 12 34 56',
    email: 'contact@benali.dz',
    address: 'Zone Industrielle Oued Smar, Alger',
    nis_nif: 'NIF: 000116012345678',
    credit_limit: 150000,
    current_debt: 14500,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Supérette El Hilal',
    phone: '0661 98 76 54',
    email: 'elhilal.market@gmail.com',
    address: 'Bab Ezzouar, Alger',
    nis_nif: 'NIF: 099916098765432',
    credit_limit: 80000,
    current_debt: 0,
    created_at: new Date().toISOString(),
  },
];

// In-browser mock implementations
const mockApi = {
  async get_products(): Promise<Product[]> {
    return getStored('products', DEFAULT_PRODUCTS);
  },

  async get_product_by_barcode(args: { barcode: string }): Promise<Product | null> {
    const products = getStored<Product[]>('products', DEFAULT_PRODUCTS);
    return products.find((p) => p.barcode === args.barcode && p.is_active) || null;
  },

  async create_product(args: { product: Product }): Promise<Product> {
    const products = getStored<Product[]>('products', DEFAULT_PRODUCTS);
    const newProd = {
      ...args.product,
      id: args.product.id || `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    products.push(newProd);
    setStored('products', products);
    return newProd;
  },

  async update_product(args: { product: Product }): Promise<Product> {
    const products = getStored<Product[]>('products', DEFAULT_PRODUCTS);
    const index = products.findIndex((p) => p.id === args.product.id);
    if (index !== -1) {
      products[index] = { ...args.product, updated_at: new Date().toISOString() };
      setStored('products', products);
    }
    return args.product;
  },

  async delete_product(args: { id: string }): Promise<boolean> {
    const products = getStored<Product[]>('products', DEFAULT_PRODUCTS);
    const index = products.findIndex((p) => p.id === args.id);
    if (index !== -1) {
      products[index].is_active = false;
      setStored('products', products);
    }
    return true;
  },

  async get_categories(): Promise<Category[]> {
    return getStored('categories', DEFAULT_CATEGORIES);
  },

  async get_customers(): Promise<Customer[]> {
    return getStored('customers', DEFAULT_CUSTOMERS);
  },

  async create_customer(args: { customer: Customer }): Promise<Customer> {
    const customers = getStored<Customer[]>('customers', DEFAULT_CUSTOMERS);
    const newCust = {
      ...args.customer,
      id: args.customer.id || `cust-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    customers.push(newCust);
    setStored('customers', customers);
    return newCust;
  },

  async update_customer(args: { customer: Customer }): Promise<Customer> {
    const customers = getStored<Customer[]>('customers', DEFAULT_CUSTOMERS);
    const idx = customers.findIndex((c) => c.id === args.customer.id);
    if (idx !== -1) {
      customers[idx] = args.customer;
      setStored('customers', customers);
    }
    return args.customer;
  },

  async pay_customer_debt(args: { customerId: string; amount: number }): Promise<number> {
    const customers = getStored<Customer[]>('customers', DEFAULT_CUSTOMERS);
    const cust = customers.find((c) => c.id === args.customerId);
    if (cust) {
      cust.current_debt = Math.max(0, cust.current_debt - args.amount);
      setStored('customers', customers);
      return cust.current_debt;
    }
    return 0;
  },

  async create_sale(args: { saleInput: CreateSaleInput }): Promise<Sale> {
    const products = getStored<Product[]>('products', DEFAULT_PRODUCTS);
    const customers = getStored<Customer[]>('customers', DEFAULT_CUSTOMERS);
    const sales = getStored<Sale[]>('sales', []);
    const movements = getStored<StockMovement[]>('stock_movements', []);

    const now = new Date();
    const invoiceNumber = `FAC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    let subtotalHt = 0;
    let totalTva = 0;

    const items = args.saleInput.items.map((i) => {
      const lineHt = i.unit_price_ht * i.quantity * (1 - i.discount_percent / 100);
      const lineTva = lineHt * (i.tva_rate / 100);
      subtotalHt += lineHt;
      totalTva += lineTva;

      // Update product stock in memory
      if (i.product_id) {
        const prod = products.find((p) => p.id === i.product_id);
        if (prod) {
          const prev = prod.current_stock;
          prod.current_stock -= i.quantity;
          movements.unshift({
            id: `mov-${Date.now()}-${Math.random()}`,
            product_id: prod.id,
            product_name: prod.name,
            movement_type: 'sale',
            quantity: -i.quantity,
            previous_stock: prev,
            new_stock: prod.current_stock,
            reason: 'Vente en caisse',
            reference_doc: invoiceNumber,
            user_id: args.saleInput.user_id,
            created_at: now.toISOString(),
          });
        }
      }

      return {
        id: `item-${Date.now()}-${Math.random()}`,
        sale_id: '',
        product_id: i.product_id,
        product_name: i.product_name,
        barcode: i.barcode,
        unit_price_ht: i.unit_price_ht,
        quantity: i.quantity,
        discount_percent: i.discount_percent,
        tva_rate: i.tva_rate,
        total_ht: lineHt,
        total_ttc: lineHt + lineTva,
      };
    });

    const totalTtc = Math.max(0, subtotalHt - args.saleInput.discount_amount) + totalTva + args.saleInput.timbre_fiscal;
    const change = Math.max(0, args.saleInput.paid_amount - totalTtc);

    const customer = customers.find((c) => c.id === args.saleInput.customer_id);
    if (args.saleInput.payment_method === 'credit' && customer) {
      const unpaid = totalTtc - args.saleInput.paid_amount;
      if (unpaid > 0) {
        customer.current_debt += unpaid;
      }
    }

    const sale: Sale = {
      id: `sale-${Date.now()}`,
      invoice_number: invoiceNumber,
      customer_id: args.saleInput.customer_id,
      customer_name: customer?.name || 'Client Comptoir',
      user_id: args.saleInput.user_id,
      user_name: 'Caissier',
      sale_type: args.saleInput.sale_type,
      subtotal_ht: subtotalHt,
      discount_amount: args.saleInput.discount_amount,
      tax_tva: totalTva,
      timbre_fiscal: args.saleInput.timbre_fiscal,
      total_ttc: totalTtc,
      paid_amount: args.saleInput.paid_amount,
      change_amount: change,
      payment_method: args.saleInput.payment_method,
      status: 'completed',
      notes: args.saleInput.notes,
      created_at: now.toISOString(),
      items,
    };

    sales.unshift(sale);
    setStored('products', products);
    setStored('customers', customers);
    setStored('sales', sales);
    setStored('stock_movements', movements);

    return sale;
  },

  async get_sales(args?: { limit?: number }): Promise<Sale[]> {
    const sales = getStored<Sale[]>('sales', []);
    return sales.slice(0, args?.limit || 100);
  },

  async add_stock_movement(args: {
    productId: string;
    movementType: 'reception' | 'sale' | 'adjustment' | 'loss' | 'return';
    quantity: number;
    reason?: string;
    referenceDoc?: string;
    userId?: string;
  }): Promise<StockMovement> {
    const products = getStored<Product[]>('products', DEFAULT_PRODUCTS);
    const movements = getStored<StockMovement[]>('stock_movements', []);
    const prod = products.find((p) => p.id === args.productId);
    if (!prod) throw new Error('Produit introuvable');

    const prev = prod.current_stock;
    let newStock = prev;
    if (args.movementType === 'reception' || args.movementType === 'return') {
      newStock += args.quantity;
    } else if (args.movementType === 'loss') {
      newStock -= args.quantity;
    } else if (args.movementType === 'adjustment') {
      newStock = args.quantity;
    }

    const delta = newStock - prev;
    prod.current_stock = newStock;
    prod.updated_at = new Date().toISOString();

    const mov: StockMovement = {
      id: `mov-${Date.now()}`,
      product_id: prod.id,
      product_name: prod.name,
      movement_type: args.movementType,
      quantity: delta,
      previous_stock: prev,
      new_stock: newStock,
      reason: args.reason,
      reference_doc: args.referenceDoc,
      user_id: args.userId,
      created_at: new Date().toISOString(),
    };

    movements.unshift(mov);
    setStored('products', products);
    setStored('stock_movements', movements);
    return mov;
  },

  async get_stock_movements(args?: { productId?: string; limit?: number }): Promise<StockMovement[]> {
    const movements = getStored<StockMovement[]>('stock_movements', []);
    const filtered = args?.productId
      ? movements.filter((m) => m.product_id === args.productId)
      : movements;
    return filtered.slice(0, args?.limit || 100);
  },

  async get_stock_valuation(): Promise<StockValuation> {
    const products = getStored<Product[]>('products', DEFAULT_PRODUCTS).filter((p) => p.is_active);
    const total_items_count = products.length;
    const total_units_in_stock = products.reduce((acc, p) => acc + p.current_stock, 0);
    const total_cost_value = products.reduce((acc, p) => acc + p.cost_price * p.current_stock, 0);
    const total_retail_value = products.reduce((acc, p) => acc + p.retail_price * p.current_stock, 0);
    return {
      total_items_count,
      total_units_in_stock,
      total_cost_value,
      total_retail_value,
      potential_profit: total_retail_value - total_cost_value,
    };
  },

  async print_receipt_escpos(args: { sale: Sale; is80mm: boolean; openDrawer: boolean }): Promise<{ success: boolean; message: string }> {
    console.log('ESC/POS Print dispatched:', args.sale.invoice_number);
    return { success: true, message: 'Ticket imprimé avec succès' };
  },

  async kick_cash_drawer(): Promise<boolean> {
    console.log('Tiroir caisse ouvert');
    return true;
  },
};

// Unified Tauri invoker with automatic browser fallback
export async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(cmd, args);
    } catch (err) {
      console.warn(`Tauri native invoke failed for "${cmd}", using fallback adapter:`, err);
    }
  }

  // Fallback routing
  const fn = (mockApi as Record<string, unknown>)[cmd];
  if (typeof fn === 'function') {
    return (await fn(args)) as T;
  }

  throw new Error(`Command "${cmd}" not implemented in fallback API.`);
}

export const api = {
  getProducts: () => invokeCommand<Product[]>('get_products'),
  getProductByBarcode: (barcode: string) => invokeCommand<Product | null>('get_product_by_barcode', { barcode }),
  createProduct: (product: Product) => invokeCommand<Product>('create_product', { product }),
  updateProduct: (product: Product) => invokeCommand<Product>('update_product', { product }),
  deleteProduct: (id: string) => invokeCommand<boolean>('delete_product', { id }),
  getCategories: () => invokeCommand<Category[]>('get_categories'),

  getCustomers: () => invokeCommand<Customer[]>('get_customers'),
  createCustomer: (customer: Customer) => invokeCommand<Customer>('create_customer', { customer }),
  updateCustomer: (customer: Customer) => invokeCommand<Customer>('update_customer', { customer }),
  payCustomerDebt: (customerId: string, amount: number) =>
    invokeCommand<number>('pay_customer_debt', { customerId, amount }),

  createSale: (saleInput: CreateSaleInput) => invokeCommand<Sale>('create_sale', { saleInput }),
  getSales: (limit = 100) => invokeCommand<Sale[]>('get_sales', { limit }),

  addStockMovement: (
    productId: string,
    movementType: 'reception' | 'sale' | 'adjustment' | 'loss' | 'return',
    quantity: number,
    reason?: string,
    referenceDoc?: string,
    userId?: string
  ) =>
    invokeCommand<StockMovement>('add_stock_movement', {
      productId,
      movementType,
      quantity,
      reason,
      referenceDoc,
      userId,
    }),
  getStockMovements: (productId?: string, limit = 100) =>
    invokeCommand<StockMovement[]>('get_stock_movements', { productId, limit }),
  getStockValuation: () => invokeCommand<StockValuation>('get_stock_valuation'),

  printReceipt: (sale: Sale, is80mm = true, openDrawer = true) =>
    invokeCommand<{ success: boolean; message: string }>('print_receipt_escpos', { sale, is80mm, openDrawer }),
  openCashDrawer: () => invokeCommand<boolean>('kick_cash_drawer'),
};
