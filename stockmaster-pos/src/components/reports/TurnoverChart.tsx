import React, { useState, useMemo } from 'react';
import { TrendingUp, Receipt, Printer, FileText, Banknote, CreditCard } from 'lucide-react';
import { Sale } from '../../types';
import { usePosStore } from '../../store/posStore';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import clsx from 'clsx';

interface TurnoverChartProps {
  sales: Sale[];
  onViewReceipt: (sale: Sale) => void;
  onViewA4: (sale: Sale) => void;
}

export const TurnoverChart: React.FC<TurnoverChartProps> = ({ sales, onViewReceipt, onViewA4 }) => {
  const { settings } = usePosStore();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (s.status !== 'completed') return false;
      const d = new Date(s.created_at);
      if (period === 'today') {
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (period === 'week') {
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
      } else if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, period]);

  const metrics = useMemo(() => {
    const totalTtc = filteredSales.reduce((sum, s) => sum + s.total_ttc, 0);
    const totalHt = filteredSales.reduce((sum, s) => sum + s.subtotal_ht, 0);
    const totalTva = filteredSales.reduce((sum, s) => sum + s.tax_tva, 0);
    const totalTimbre = filteredSales.reduce((sum, s) => sum + s.timbre_fiscal, 0);
    const paymentTotals = filteredSales.reduce((acc, s) => {
      acc[s.payment_method] = (acc[s.payment_method] || 0) + s.total_ttc;
      return acc;
    }, {} as Record<string, number>);
    return { count: filteredSales.length, totalTtc, totalHt, totalTva, totalTimbre, paymentTotals };
  }, [filteredSales]);

  const periodTabs = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'week', label: '7 jours' },
    { id: 'month', label: 'Ce mois' },
    { id: 'all', label: 'Tout' },
  ];

  const paymentMethodLabel = (m: string) => {
    const map: Record<string, string> = { cash: 'Espèces', card: 'Carte/CIB', check: 'Chèque', credit: 'Crédit', mixed: 'Mixte' };
    return map[m] || m;
  };

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {periodTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-medium transition',
                period === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          <span className="font-semibold text-gray-700">{metrics.count}</span> vente(s)
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Chiffre d'affaires TTC", value: formatCurrency(metrics.totalTtc, settings.currency), accent: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'Hors Taxes (HT)', value: formatCurrency(metrics.totalHt, settings.currency), accent: 'text-gray-900', bg: 'bg-white border-gray-200' },
          { label: 'TVA collectée', value: formatCurrency(metrics.totalTva, settings.currency), accent: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Timbre fiscal', value: formatCurrency(metrics.totalTimbre, settings.currency), accent: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
        ].map((card, i) => (
          <div key={i} className={clsx('rounded-xl border px-4 py-3 shadow-sm', card.bg)}>
            <p className="text-[11px] text-gray-500 font-medium mb-1">{card.label}</p>
            <p className={clsx('text-xl font-bold font-mono', card.accent)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Payment method breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Ventilation par mode de paiement</h3>
        <div className="grid grid-cols-4 gap-3">
          {['cash', 'card', 'check', 'credit'].map((pm) => (
            <div key={pm} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[11px] text-gray-400 mb-1">{paymentMethodLabel(pm)}</p>
              <p className="text-sm font-bold text-gray-800 font-mono">
                {formatCurrency(metrics.paymentTotals[pm] || 0, settings.currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sales table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Détail des ventes</h3>
          <span className="text-xs text-gray-400">Transactions récentes</span>
        </div>

        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold sticky top-0 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-4">N° Facture</th>
                <th className="py-2.5 px-4">Date & Heure</th>
                <th className="py-2.5 px-4">Client</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Paiement</th>
                <th className="py-2.5 px-4 text-right">Total TTC</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Aucune vente sur cette période.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition group">
                    <td className="py-2.5 px-4 font-mono font-semibold text-indigo-600">{s.invoice_number}</td>
                    <td className="py-2.5 px-4 font-mono text-gray-400 text-[11px]">{formatDateTime(s.created_at)}</td>
                    <td className="py-2.5 px-4 text-gray-700">{s.customer_name || 'Client comptoir'}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium uppercase">
                        {s.sale_type === 'wholesale' ? 'Gros' : 'Détail'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">{paymentMethodLabel(s.payment_method)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(s.total_ttc, settings.currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onViewReceipt(s)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
                          title="Ticket thermique"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onViewA4(s)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                          title="Facture A4"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};