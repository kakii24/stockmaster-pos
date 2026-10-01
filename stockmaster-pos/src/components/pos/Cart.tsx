import React from 'react';
import { Trash2, Plus, Minus, User, Percent, PauseCircle, CreditCard, ShoppingBag, AlertCircle, X } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../lib/formatters';
import clsx from 'clsx';

interface CartProps {
  onOpenCustomerSelect: () => void;
  onOpenDiscountModal: () => void;
  onOpenPaymentModal: () => void;
  onClearCartConfirm: () => void;
}

export const Cart: React.FC<CartProps> = ({
  onOpenCustomerSelect,
  onOpenDiscountModal,
  onOpenPaymentModal,
  onClearCartConfirm,
}) => {
  const {
    selectedCustomer,
    setSelectedCustomer,
    updateQuantity,
    removeFromCart,
    holdCurrentTicket,
    settings,
    saleType,
  } = usePosStore();

  const {
    items,
    totalUnits,
    subtotalHt,
    globalDiscount,
    totalTva,
    timbreCash,
    totalTtcCash,
    isEmpty,
  } = useCart();

  return (
    <div className="w-80 md:w-[360px] bg-white border-l border-gray-200 flex flex-col justify-between shrink-0">
      {/* Customer row */}
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="font-medium text-xs text-gray-800 truncate">
                {selectedCustomer ? selectedCustomer.name : 'Client comptoir'}
              </span>
              {selectedCustomer && (
                <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {selectedCustomer?.current_debt > 0 && (
              <span className="text-[10px] text-red-500 flex items-center gap-0.5 font-medium">
                <AlertCircle className="w-2.5 h-2.5" />
                Dette: {formatCurrency(selectedCustomer.current_debt, settings.currency)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onOpenCustomerSelect}
          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 shrink-0 px-2 py-1 rounded hover:bg-indigo-50 transition"
        >
          Changer
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-500">Panier vide</p>
              <p className="text-xs text-gray-400 mt-0.5">Cliquez sur un article ou scannez un code-barres.</p>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex flex-col gap-1.5"
            >
              {/* Name & delete */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-medium text-xs text-gray-800 truncate leading-snug">{item.product.name}</h4>
                  {item.discount_percent > 0 && (
                    <span className="text-[10px] text-amber-600 font-medium">Remise -{item.discount_percent}%</span>
                  )}
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-gray-300 hover:text-red-500 transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stepper & price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) updateQuantity(item.product.id, val);
                    }}
                    className="w-9 text-center text-xs font-semibold bg-transparent text-gray-800 focus:outline-none"
                  />
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-mono">
                    {formatCurrency(item.unit_price, settings.currency)} / {item.product.unit}
                  </span>
                  <span className="font-semibold text-sm text-gray-900 font-mono">
                    {formatCurrency(item.lineTtc, settings.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary & Actions */}
      <div className="border-t border-gray-100 bg-gray-50 p-4 flex flex-col gap-3">
        {/* Breakdown */}
        <div className="space-y-1 text-xs text-gray-500 border-b border-gray-100 pb-3">
          <div className="flex justify-between">
            <span>Sous-total HT</span>
            <span className="font-mono text-gray-700">{formatCurrency(subtotalHt, settings.currency)}</span>
          </div>
          {globalDiscount > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Remise globale</span>
              <span className="font-mono">-{formatCurrency(globalDiscount, settings.currency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>TVA</span>
            <span className="font-mono text-gray-700">{formatCurrency(totalTva, settings.currency)}</span>
          </div>
          {timbreCash > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Timbre fiscal</span>
              <span className="font-mono">{formatCurrency(timbreCash, settings.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-400 text-[10px] pt-0.5">
            <span>{items.length} article(s) — {totalUnits} unités</span>
            <span>{saleType === 'wholesale' ? 'Tarif Gros' : 'Tarif Détail'}</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Net à payer</span>
          <span className="text-xl font-bold text-gray-900 font-mono">
            {formatCurrency(totalTtcCash, settings.currency)}
          </span>
        </div>

        {/* Secondary actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            disabled={isEmpty}
            onClick={onClearCartConfirm}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-500 hover:text-red-600 text-xs font-medium transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 className="w-3 h-3" />
            <span>Vider</span>
          </button>

          <button
            disabled={isEmpty}
            onClick={onOpenDiscountModal}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 text-xs font-medium transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <Percent className="w-3 h-3" />
            <span>Remise</span>
          </button>

          <button
            disabled={isEmpty}
            onClick={holdCurrentTicket}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-200 text-gray-500 hover:text-amber-600 text-xs font-medium transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <PauseCircle className="w-3 h-3" />
            <span>Attente</span>
          </button>
        </div>

        {/* Checkout button */}
        <button
          disabled={isEmpty}
          onClick={onOpenPaymentModal}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition active:scale-[0.99] flex items-center justify-between px-4 disabled:opacity-40 disabled:pointer-events-none"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Encaisser</span>
          </div>
          <span className="font-bold font-mono">{formatCurrency(totalTtcCash, settings.currency)}</span>
        </button>
      </div>
    </div>
  );
};