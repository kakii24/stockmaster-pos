import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';


import { QuickGrid } from './components/pos/QuickGrid';
import { Cart } from './components/pos/Cart';
import { PaymentModal } from './components/pos/PaymentModal';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { A4InvoiceModal } from './components/pos/A4InvoiceModal';
import { CustomerSelectModal } from './components/pos/CustomerSelectModal';
import { DiscountModal } from './components/pos/DiscountModal';
import { HeldTicketsModal } from './components/pos/HeldTicketsModal';
import { ShortcutsModal } from './components/pos/ShortcutsModal';

import { StockTable } from './components/inventory/StockTable';
import { ProductModal } from './components/inventory/ProductModal';
import { MovementModal } from './components/inventory/MovementModal';

import { CustomerList } from './components/customers/CustomerList';
import { CustomerModal } from './components/customers/CustomerModal';
import { CustomerDebtModal } from './components/customers/CustomerDebtModal';

import { TurnoverChart } from './components/reports/TurnoverChart';
import { CashDrawer } from './components/reports/CashDrawer';
import { SettingsModal } from './components/settings/SettingsModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';

import { usePosStore } from './store/posStore';
import { useAuthStore } from './store/authStore';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { api } from './api';
import { Customer, Product, Sale } from './types';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    activeView,
    cart,
    addToCart,
    clearCart,
    toggleSaleType,
    holdCurrentTicket,
    selectedCustomer,
    globalDiscount,
    saleType,
  } = usePosStore();

  const { currentUser } = useAuthStore();

  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: api.getCustomers,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.getSales(100),
  });

  const { data: valuation = null } = useQuery({
    queryKey: ['valuation'],
    queryFn: api.getStockValuation,
  });

  // Local state for UI modals & dialogs
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [isHeldTicketsOpen, setIsHeldTicketsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState(false);

  // Active Sale Receipt / A4 Modals
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [activeA4Sale, setActiveA4Sale] = useState<Sale | null>(null);

  // Inventory Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementSelectedProduct, setMovementSelectedProduct] = useState<Product | null>(null);

  // Customer Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [debtCustomer, setDebtCustomer] = useState<Customer | null>(null);

  // Reports View Tab ('turnover' | 'drawer')
  const [reportsTab, setReportsTab] = useState<'turnover' | 'drawer'>('turnover');

  // Scanner Hardware Hook (< 50ms keystrokes buffer)
  useBarcodeScanner({
    onScan: (barcode) => {
      const found = products.find((p) => p.barcode === barcode && p.is_active);
      if (found) {
        addToCart(found, 1);
      } else {
        // Fallback: put barcode in search box so cashier sees it immediately
        setSearchQuery(barcode);
      }
    },
  });

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onHelp: () => setIsShortcutsOpen((prev) => !prev),
    onNewSale: () => {
      if (cart.length > 0) setIsClearCartConfirmOpen(true);
    },
    onToggleSaleType: () => toggleSaleType(),
    onSelectCustomer: () => setIsCustomerSelectOpen(true),
    onGlobalDiscount: () => {
      if (cart.length > 0) setIsDiscountOpen(true);
    },
    onHoldTicket: () => {
      if (cart.length > 0) holdCurrentTicket();
    },
    onCheckout: () => {
      if (cart.length > 0) setIsPaymentOpen(true);
    },
    onEscape: () => {
      setIsPaymentOpen(false);
      setIsCustomerSelectOpen(false);
      setIsDiscountOpen(false);
      setIsHeldTicketsOpen(false);
      setIsShortcutsOpen(false);
      setIsClearCartConfirmOpen(false);
      setActiveReceiptSale(null);
      setActiveA4Sale(null);
      setIsProductModalOpen(false);
      setIsMovementModalOpen(false);
      setIsCustomerModalOpen(false);
      setDebtCustomer(null);
    },
  });

  // Mutations
  const createSaleMutation = useMutation({
    mutationFn: api.createSale,
    onSuccess: (newSale) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['valuation'] });
      clearCart();
      setIsPaymentOpen(false);
      setActiveReceiptSale(newSale);
    },
  });

  const saveProductMutation = useMutation({
    mutationFn: (p: Product) => (p.id ? api.updateProduct(p) : api.createProduct(p)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['valuation'] });
      setIsProductModalOpen(false);
      setEditingProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['valuation'] });
      setProductToDelete(null);
    },
  });

  const stockMovementMutation = useMutation({
    mutationFn: (data: {
      productId: string;
      movementType: 'reception' | 'adjustment' | 'loss' | 'return';
      quantity: number;
      reason?: string;
      referenceDoc?: string;
    }) =>
      api.addStockMovement(
        data.productId,
        data.movementType,
        data.quantity,
        data.reason,
        data.referenceDoc,
        currentUser?.id
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['valuation'] });
      setIsMovementModalOpen(false);
    },
  });

  const saveCustomerMutation = useMutation({
    mutationFn: (c: Customer) => (c.id ? api.updateCustomer(c) : api.createCustomer(c)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
    },
  });

  const payDebtMutation = useMutation({
    mutationFn: (data: { customerId: string; amount: number }) =>
      api.payCustomerDebt(data.customerId, data.amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDebtCustomer(null);
    },
  });

  const handleProcessSale = (paymentData: {
    paymentMethod: 'cash' | 'card' | 'check' | 'credit' | 'mixed';
    paidAmount: number;
    printReceipt: boolean;
    openDrawer: boolean;
    notes?: string;
  }) => {
    const items = cart.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      barcode: item.product.barcode,
      unit_price_ht: item.unit_price,
      quantity: item.quantity,
      discount_percent: item.discount_percent,
      tva_rate: item.tva_rate,
    }));

    createSaleMutation.mutate({
      customer_id: selectedCustomer?.id || null,
      user_id: currentUser?.id || null,
      sale_type: saleType,
      discount_amount: globalDiscount,
      timbre_fiscal: paymentData.paymentMethod === 'cash' ? 10 : 0, // auto recalculated
      paid_amount: paymentData.paidAmount,
      payment_method: paymentData.paymentMethod,
      notes: paymentData.notes,
      items,
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-sans antialiased">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenHeldTickets={() => setIsHeldTicketsOpen(true)}
        />

        {/* View Switcher Container */}
        <main className="flex-1 flex min-h-0 overflow-hidden relative">
          {activeView === 'pos' && (
            <>
              <QuickGrid
                products={products}
                categories={categories}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectProduct={(p) => addToCart(p, 1)}
              />
              <Cart
                onOpenCustomerSelect={() => setIsCustomerSelectOpen(true)}
                onOpenDiscountModal={() => setIsDiscountOpen(true)}
                onOpenPaymentModal={() => setIsPaymentOpen(true)}
                onClearCartConfirm={() => setIsClearCartConfirmOpen(true)}
              />
            </>
          )}

          {activeView === 'inventory' && (
            <StockTable
              products={products}
              categories={categories}
              valuation={valuation}
              onOpenCreateProduct={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenEditProduct={(p) => {
                setEditingProduct(p);
                setIsProductModalOpen(true);
              }}
              onDeleteProductConfirm={(p) => setProductToDelete(p)}
              onOpenMovementModal={(p) => {
                setMovementSelectedProduct(p || null);
                setIsMovementModalOpen(true);
              }}
            />
          )}

          {activeView === 'customers' && (
            <CustomerList
              customers={customers}
              onOpenCreateCustomer={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              onOpenEditCustomer={(c) => {
                setEditingCustomer(c);
                setIsCustomerModalOpen(true);
              }}
              onOpenPayDebt={(c) => setDebtCustomer(c)}
            />
          )}

          {activeView === 'reports' && (
            <div className="flex-1 flex flex-col p-5 overflow-y-auto bg-gray-50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Rapports & Analyses</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Chiffre d'affaires, marges et clôture de caisse</p>
                </div>

                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setReportsTab('turnover')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
                      reportsTab === 'turnover'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Chiffre d'Affaires
                  </button>
                  <button
                    onClick={() => setReportsTab('drawer')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
                      reportsTab === 'drawer'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Clôture de Caisse
                  </button>
                </div>
              </div>

              {reportsTab === 'turnover' ? (
                <TurnoverChart
                  sales={sales}
                  onViewReceipt={(s) => setActiveReceiptSale(s)}
                  onViewA4={(s) => setActiveA4Sale(s)}
                />
              ) : (
                <CashDrawer sales={sales} />
              )}
            </div>
          )}

          {activeView === 'settings' && <SettingsModal />}
        </main>


      </div>

      {/* Modals & Dialogs */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onProcessSale={handleProcessSale}
        isProcessing={createSaleMutation.isPending}
      />

      <ReceiptModal
        isOpen={!!activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
        sale={activeReceiptSale}
        onOpenA4={() => {
          setActiveA4Sale(activeReceiptSale);
          setActiveReceiptSale(null);
        }}
      />

      <A4InvoiceModal
        isOpen={!!activeA4Sale}
        onClose={() => setActiveA4Sale(null)}
        sale={activeA4Sale}
      />

      <CustomerSelectModal
        isOpen={isCustomerSelectOpen}
        onClose={() => setIsCustomerSelectOpen(false)}
        customers={customers}
        onOpenCreateCustomer={() => {
          setEditingCustomer(null);
          setIsCustomerModalOpen(true);
        }}
      />

      <DiscountModal
        isOpen={isDiscountOpen}
        onClose={() => setIsDiscountOpen(false)}
      />

      <HeldTicketsModal
        isOpen={isHeldTicketsOpen}
        onClose={() => setIsHeldTicketsOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={(p) => saveProductMutation.mutate(p)}
        product={editingProduct}
        categories={categories}
      />

      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setMovementSelectedProduct(null);
        }}
        onSaveMovement={(d) => stockMovementMutation.mutate(d)}
        products={products}
        selectedProduct={movementSelectedProduct}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={(c) => saveCustomerMutation.mutate(c)}
        customer={editingCustomer}
      />

      <CustomerDebtModal
        isOpen={!!debtCustomer}
        onClose={() => setDebtCustomer(null)}
        customer={debtCustomer}
        onConfirmPayment={(customerId, amount) =>
          payDebtMutation.mutate({ customerId, amount })
        }
      />

      <ConfirmDialog
        isOpen={isClearCartConfirmOpen}
        onClose={() => setIsClearCartConfirmOpen(false)}
        onConfirm={() => clearCart()}
        title="Vider le panier"
        message="Êtes-vous sûr de vouloir vider l'ensemble du panier et annuler la vente en cours ?"
        confirmLabel="Vider le panier"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) deleteProductMutation.mutate(productToDelete.id);
        }}
        title="Désactiver l'article"
        message={`Confirmez-vous la désactivation de l'article "${productToDelete?.name}" ? L'historique des ventes antérieures sera conservé.`}
        confirmLabel="Désactiver"
        variant="danger"
      />
    </div>
  );
};
