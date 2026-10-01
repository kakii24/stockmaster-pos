import { create } from 'zustand';
import { ActiveView, CartItem, Customer, Product, StoreSettings } from '../types';

export interface HeldTicket {
  id: string;
  name: string;
  cart: CartItem[];
  customer: Customer | null;
  saleType: 'retail' | 'wholesale';
  timestamp: string;
}

interface PosState {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  saleType: 'retail' | 'wholesale';
  globalDiscount: number;
  activeView: ActiveView;
  heldTickets: HeldTicket[];
  settings: StoreSettings;

  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemPrice: (productId: string, price: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  setSaleType: (type: 'retail' | 'wholesale') => void;
  toggleSaleType: () => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setGlobalDiscount: (amount: number) => void;
  holdCurrentTicket: () => void;
  restoreHeldTicket: (ticketId: string) => void;
  deleteHeldTicket: (ticketId: string) => void;
  setActiveView: (view: ActiveView) => void;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
}

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'STOCKMASTER DISTRIBUTION',
  store_address: '12 Boulevard des Martyrs, Alger',
  store_phone: '+213 21 00 00 00',
  store_nif_nis: 'NIF: 099816001234567 | RC: 16/00-12345B',
  currency: 'DZD',
  default_tva: 19.0,
  enable_timbre_fiscal: true,
  timbre_fiscal_rate: 1.0,
  timbre_fiscal_min: 10.0,
  timbre_fiscal_max: 2500.0,
  printer_type: 'escpos_80mm',
  receipt_footer: 'Merci de votre visite et à bientôt !',
};

// Load saved settings if any
const savedSettings = (() => {
  try {
    const raw = localStorage.getItem('stockmaster_settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
})();

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  selectedCustomer: null,
  saleType: 'retail',
  globalDiscount: 0,
  activeView: 'pos',
  heldTickets: [],
  settings: savedSettings,

  addToCart: (product: Product, quantity = 1) => {
    const { cart, saleType } = get();
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    // Wholesale automatic pricing if mode is wholesale
    const basePrice = saleType === 'wholesale' ? product.wholesale_price : product.retail_price;

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + quantity;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: Math.max(0.1, newQty),
      };
      set({ cart: updated });
    } else {
      const newItem: CartItem = {
        id: product.id,
        product,
        quantity,
        unit_price: basePrice,
        discount_percent: 0,
        tva_rate: product.tva_rate,
      };
      set({ cart: [...cart, newItem] });
    }
  },

  removeFromCart: (productId: string) => {
    set((state) => ({ cart: state.cart.filter((item) => item.product.id !== productId) }));
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  updateItemPrice: (productId: string, unit_price: number) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, unit_price: Math.max(0, unit_price) } : item
      ),
    }));
  },

  updateItemDiscount: (productId: string, discount_percent: number) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId
          ? { ...item, discount_percent: Math.min(100, Math.max(0, discount_percent)) }
          : item
      ),
    }));
  },

  clearCart: () => {
    set({ cart: [], globalDiscount: 0 });
  },

  setSaleType: (type: 'retail' | 'wholesale') => {
    const { cart } = get();
    const updatedCart = cart.map((item) => ({
      ...item,
      unit_price: type === 'wholesale' ? item.product.wholesale_price : item.product.retail_price,
    }));
    set({ saleType: type, cart: updatedCart });
  },

  toggleSaleType: () => {
    const nextType = get().saleType === 'retail' ? 'wholesale' : 'retail';
    get().setSaleType(nextType);
  },

  setSelectedCustomer: (customer: Customer | null) => {
    set({ selectedCustomer: customer });
  },

  setGlobalDiscount: (amount: number) => {
    set({ globalDiscount: Math.max(0, amount) });
  },

  holdCurrentTicket: () => {
    const { cart, selectedCustomer, saleType, heldTickets } = get();
    if (cart.length === 0) return;

    const newTicket: HeldTicket = {
      id: `ticket-${Date.now()}`,
      name: selectedCustomer ? selectedCustomer.name : `Ticket ${heldTickets.length + 1}`,
      cart: [...cart],
      customer: selectedCustomer,
      saleType,
      timestamp: new Date().toISOString(),
    };

    set({
      heldTickets: [newTicket, ...heldTickets],
      cart: [],
      selectedCustomer: null,
      globalDiscount: 0,
    });
  },

  restoreHeldTicket: (ticketId: string) => {
    const { heldTickets } = get();
    const ticket = heldTickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    set({
      cart: ticket.cart,
      selectedCustomer: ticket.customer,
      saleType: ticket.saleType,
      heldTickets: heldTickets.filter((t) => t.id !== ticketId),
    });
  },

  deleteHeldTicket: (ticketId: string) => {
    set((state) => ({
      heldTickets: state.heldTickets.filter((t) => t.id !== ticketId),
    }));
  },

  setActiveView: (activeView: ActiveView) => {
    set({ activeView });
  },

  updateSettings: (newSettings: Partial<StoreSettings>) => {
    set((state) => {
      const merged = { ...state.settings, ...newSettings };
      try {
        localStorage.setItem('stockmaster_settings', JSON.stringify(merged));
      } catch (e) {
        console.error(e);
      }
      return { settings: merged };
    });
  },
}));
