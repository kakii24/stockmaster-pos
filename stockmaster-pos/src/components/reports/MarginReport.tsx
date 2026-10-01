import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Percent, Award, ArrowUpRight } from 'lucide-react';
import { Product, Sale } from '../../types';
import { usePosStore } from '../../store/posStore';
import { formatCurrency } from '../../lib/formatters';

interface MarginReportProps {
  sales: Sale[];
  products: Product[];
}

export const MarginReport: React.FC<MarginReportProps> = ({ sales, products }) => {
  const { settings } = usePosStore();

  const marginData = useMemo(() => {
    let totalSalesHt = 0;
    let totalCostHt = 0;
    const itemMargins: Record<string, { name: string; qty: number; salesHt: number; costHt: number; margin: number }> = {};

    for (const sale of sales) {
      if (sale.status !== 'completed') continue;
      for (const item of sale.items) {
        const prod = products.find((p) => p.id === item.product_id);
        const unitCost = prod ? prod.cost_price : item.unit_price_ht * 0.7; // default 30% margin fallback if unreferenced
        const lineCost = unitCost * item.quantity;
        const lineSalesHt = item.total_ht;

        totalSalesHt += lineSalesHt;
        totalCostHt += lineCost;

        if (!itemMargins[item.barcode]) {
          itemMargins[item.barcode] = {
            name: item.product_name,
            qty: 0,
            salesHt: 0,
            costHt: 0,
            margin: 0,
          };
        }
        itemMargins[item.barcode].qty += item.quantity;
        itemMargins[item.barcode].salesHt += lineSalesHt;
        itemMargins[item.barcode].costHt += lineCost;
        itemMargins[item.barcode].margin += lineSalesHt - lineCost;
      }
    }

    const grossMargin = totalSalesHt - totalCostHt;
    const marginRate = totalSalesHt > 0 ? (grossMargin / totalSalesHt) * 100 : 0;
    const sortedItems = Object.values(itemMargins).sort((a, b) => b.margin - a.margin);

    return {
      totalSalesHt,
      totalCostHt,
      grossMargin,
      marginRate,
      topItems: sortedItems,
    };
  }, [sales, products]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
            Chiffre d'Affaires HT
          </span>
          <span className="text-xl font-bold font-mono text-slate-200">
            {formatCurrency(marginData.totalSalesHt, settings.currency)}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
            Coût d'Achat des Ventes
          </span>
          <span className="text-xl font-bold font-mono text-slate-400">
            {formatCurrency(marginData.totalCostHt, settings.currency)}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase text-emerald-400 block mb-1">
            Marge Brute Réalisée
          </span>
          <span className="text-2xl font-black font-mono text-emerald-400">
            {formatCurrency(marginData.grossMargin, settings.currency)}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase text-sky-400 block mb-1">
            Taux de Marge Moyen
          </span>
          <span className="text-2xl font-black font-mono text-sky-400">
            {marginData.marginRate.toFixed(1)} %
          </span>
        </div>
      </div>

      {/* Margins per product table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-inner">
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Classement des Articles par Rentabilité & Marge</span>
          </h3>
          <span className="text-xs text-slate-500">Marge Brute Décroissante</span>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/90 text-slate-400 font-bold sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Article</th>
                <th className="py-2.5 px-4 text-center">Unités Vendues</th>
                <th className="py-2.5 px-4 text-right">Ventes HT</th>
                <th className="py-2.5 px-4 text-right">Coût HT</th>
                <th className="py-2.5 px-4 text-right">Marge Brute</th>
                <th className="py-2.5 px-4 text-center">Taux Marge %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {marginData.topItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Aucune vente pour le calcul de marge.
                  </td>
                </tr>
              ) : (
                marginData.topItems.map((item, idx) => {
                  const rate = item.salesHt > 0 ? (item.margin / item.salesHt) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-850/60 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-100">{item.name}</td>
                      <td className="py-2.5 px-4 text-center font-mono">{item.qty}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(item.salesHt, settings.currency)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(item.costHt, settings.currency)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(item.margin, settings.currency)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 font-mono font-bold text-[11px] border border-emerald-800/50">
                          {rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
