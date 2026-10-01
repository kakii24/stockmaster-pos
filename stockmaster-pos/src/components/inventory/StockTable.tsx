import React, { useState, useMemo } from 'react';
import { Search, Plus, RefreshCw, FileDown, Edit2, Trash2, AlertTriangle, Package, TrendingUp, DollarSign, BarChart2 } from 'lucide-react';
import { Category, Product, StockValuation } from '../../types';
import { usePosStore } from '../../store/posStore';
import { formatCurrency } from '../../lib/formatters';
import { LowStockAlert } from './LowStockAlert';
import clsx from 'clsx';

interface StockTableProps {
  products: Product[];
  categories: Category[];
  valuation: StockValuation | null;
  onOpenCreateProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onDeleteProductConfirm: (product: Product) => void;
  onOpenMovementModal: (product?: Product) => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  products,
  categories,
  valuation,
  onOpenCreateProduct,
  onOpenEditProduct,
  onDeleteProductConfirm,
  onOpenMovementModal,
}) => {
  const { settings } = usePosStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.is_active) return false;
      const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);
      const matchesLowStock = !showLowStockOnly || p.current_stock <= p.min_stock_alert;
      return matchesCat && matchesSearch && matchesLowStock;
    });
  }, [products, selectedCategory, search, showLowStockOnly]);

  const exportCSV = () => {
    const headers = ['Code-Barres', 'Designation', 'Categorie', 'Stock', 'Unite', 'Prix Achat HT', 'Prix Vente Detail', 'Prix Vente Gros', 'TVA %'];
    const rows = filtered.map((p) => [
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category_name || ''}"`,
      p.current_stock,
      `"${p.unit}"`,
      p.cost_price,
      p.retail_price,
      p.wholesale_price,
      p.tva_rate,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stockmaster_inventaire_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col p-5 overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gestion du Stock</h2>
          <p className="text-xs text-gray-500 mt-0.5">Catalogue articles, prix et niveaux de stock</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-medium transition shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => onOpenMovementModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-medium transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            <span>Mouvement</span>
          </button>

          <button
            onClick={onOpenCreateProduct}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {valuation && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Articles', value: valuation.total_items_count, sub: `${valuation.total_units_in_stock} unités`, icon: Package, color: 'text-indigo-600 bg-indigo-50' },
            { label: "Valeur d'achat", value: formatCurrency(valuation.total_cost_value, settings.currency), icon: DollarSign, color: 'text-gray-600 bg-gray-100' },
            { label: 'Valeur vente', value: formatCurrency(valuation.total_retail_value, settings.currency), icon: BarChart2, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Marge brute', value: formatCurrency(valuation.potential_profit, settings.currency), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm flex items-center gap-3">
                <div className={clsx('p-2 rounded-lg shrink-0', card.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">{card.label}</p>
                  <p className="text-sm font-bold text-gray-900 font-mono">{card.value}</p>
                  {card.sub && <p className="text-[10px] text-gray-400">{card.sub}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Low stock alert */}
      <LowStockAlert products={products} onRestockClick={(p) => onOpenMovementModal(p)} />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrer par nom ou code-barres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-amber-700 cursor-pointer bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-amber-300 text-amber-500 focus:ring-amber-300"
          />
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Stock bas seulement</span>
        </label>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold sticky top-0 z-10 border-b border-gray-200">
            <tr>
              <th className="py-2.5 px-4">Désignation</th>
              <th className="py-2.5 px-4">Code-barres</th>
              <th className="py-2.5 px-4">Catégorie</th>
              <th className="py-2.5 px-4 text-center">Stock</th>
              <th className="py-2.5 px-4 text-right">P. Achat</th>
              <th className="py-2.5 px-4 text-right">P. Détail</th>
              <th className="py-2.5 px-4 text-right">P. Gros</th>
              <th className="py-2.5 px-4 text-center">TVA</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-400">
                  Aucun article ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isLow = item.current_stock <= item.min_stock_alert && item.current_stock > 0;
                const isOut = item.current_stock <= 0;

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition group">
                    <td className="py-2.5 px-4 font-medium text-gray-900">{item.name}</td>

                    <td className="py-2.5 px-4 font-mono text-gray-400 text-[11px]">{item.barcode}</td>

                    <td className="py-2.5 px-4">
                      {item.category_name ? (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">
                          {item.category_name}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-semibold text-[11px]',
                          isOut
                            ? 'bg-red-50 text-red-600'
                            : isLow
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-700'
                        )}
                      >
                        {isLow && <AlertTriangle className="w-2.5 h-2.5" />}
                        {item.current_stock} {item.unit}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono text-gray-500">
                      {formatCurrency(item.cost_price, settings.currency)}
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-700">
                      {formatCurrency(item.retail_price, settings.currency)}
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono text-amber-600">
                      {formatCurrency(item.wholesale_price, settings.currency)}
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono text-gray-400">{item.tva_rate}%</td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onOpenMovementModal(item)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                          title="Mouvement de stock"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenEditProduct(item)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProductConfirm(item)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};