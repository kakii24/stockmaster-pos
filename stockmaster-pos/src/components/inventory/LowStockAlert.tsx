import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Product } from '../../types';

interface LowStockAlertProps {
  products: Product[];
  onRestockClick: (product: Product) => void;
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({ products, onRestockClick }) => {
  const lowStockItems = products.filter((p) => p.is_active && p.current_stock <= p.min_stock_alert);

  if (lowStockItems.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
      <div className="flex items-center gap-2 text-amber-700 mb-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="font-semibold text-sm">
          Alerte stock bas — {lowStockItems.length} article(s) en dessous du seuil
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {lowStockItems.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="bg-white border border-amber-100 rounded-lg px-3 py-2 flex items-center justify-between text-xs"
          >
            <div className="min-w-0 pr-2">
              <span className="font-medium text-gray-800 block truncate">{item.name}</span>
              <span className="text-[11px] text-red-500 font-mono">
                {item.current_stock} {item.unit} (seuil: {item.min_stock_alert})
              </span>
            </div>

            <button
              onClick={() => onRestockClick(item)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-700 font-medium text-[10px] transition shrink-0"
            >
              <span>Réappro.</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};