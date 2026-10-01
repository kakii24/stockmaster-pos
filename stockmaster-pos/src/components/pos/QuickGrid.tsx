import React, { useState, useMemo } from 'react';
import { Search, Package, AlertTriangle, X } from 'lucide-react';
import { Category, Product } from '../../types';
import { usePosStore } from '../../store/posStore';
import { formatCurrency } from '../../lib/formatters';
import clsx from 'clsx';

interface QuickGridProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const QuickGrid: React.FC<QuickGridProps> = ({
  products,
  categories,
  searchQuery,
  onSearchChange,
  onSelectProduct,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const { saleType, settings } = usePosStore();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.is_active) return false;
      const matchesCategory =
        selectedCategoryId === 'all' || p.category_id === selectedCategoryId;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50 p-4 gap-3 overflow-hidden">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou code-barres..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 shrink-0">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border',
            selectedCategoryId === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
          )}
        >
          Tous ({products.filter((p) => p.is_active).length})
        </button>
        {categories.map((cat) => {
          const count = products.filter((p) => p.is_active && p.category_id === cat.id).length;
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border flex items-center gap-1.5',
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
            <Package className="w-10 h-10 stroke-[1.5]" />
            <p className="text-sm">Aucun article trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pb-2">
            {filteredProducts.map((p) => {
              const activePrice = saleType === 'wholesale' ? p.wholesale_price : p.retail_price;
              const isLowStock = p.current_stock <= p.min_stock_alert && p.current_stock > 0;
              const isOut = p.current_stock <= 0;

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="group relative bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-3 flex flex-col text-left cursor-pointer transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  {/* Category color dot */}
                  {p.category_name && (
                    <span className="text-[10px] text-gray-400 mb-1 truncate">{p.category_name}</span>
                  )}

                  {/* Product Name */}
                  <h3 className="font-semibold text-sm text-gray-800 group-hover:text-indigo-700 line-clamp-2 leading-snug flex-1">
                    {p.name}
                  </h3>

                  {/* Bottom: stock + price */}
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-end justify-between">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded',
                        isOut
                          ? 'bg-red-50 text-red-600'
                          : isLowStock
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-700'
                      )}
                    >
                      {isLowStock && <AlertTriangle className="w-2.5 h-2.5" />}
                      {p.current_stock} {p.unit}
                    </span>

                    <span className="font-bold text-sm text-indigo-700 font-mono">
                      {formatCurrency(activePrice, settings.currency)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};