import React, { useState } from 'react';
import { Banknote, Lock, AlertTriangle, CheckCircle2, Calculator } from 'lucide-react';
import { Sale } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { usePosStore } from '../../store/posStore';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import clsx from 'clsx';

interface CashDrawerProps {
  sales: Sale[];
}

export const CashDrawer: React.FC<CashDrawerProps> = ({ sales }) => {
  const { currentSession, closeSession } = useAuthStore();
  const { settings } = usePosStore();

  const [countedCashStr, setCountedCashStr] = useState<string>('');
  const [isClosedSuccess, setIsClosedSuccess] = useState<boolean>(false);

  const openingCash = currentSession?.opening_cash || 0;
  const sessionSales = sales.filter((s) => s.status === 'completed');
  const cashSalesTotal = sessionSales.filter((s) => s.payment_method === 'cash').reduce((sum, s) => sum + s.total_ttc, 0);
  const cardSalesTotal = sessionSales.filter((s) => s.payment_method === 'card').reduce((sum, s) => sum + s.total_ttc, 0);
  const creditSalesTotal = sessionSales.filter((s) => s.payment_method === 'credit').reduce((sum, s) => sum + s.total_ttc, 0);

  const expectedCashInDrawer = openingCash + cashSalesTotal;
  const countedCash = parseFloat(countedCashStr) || 0;
  const difference = countedCash - expectedCashInDrawer;

  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countedCashStr) {
      alert('Veuillez saisir le montant réel compté en caisse !');
      return;
    }
    closeSession(countedCash, expectedCashInDrawer);
    setIsClosedSuccess(true);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            Clôture de Caisse
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Session ouverte le {formatDateTime(currentSession?.opened_at)}
          </p>
        </div>
        <span className={clsx(
          'px-3 py-1 rounded-full text-xs font-semibold',
          currentSession?.status === 'closed'
            ? 'bg-red-50 text-red-600 border border-red-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        )}>
          {currentSession?.status === 'closed' ? 'Clôturée' : 'Active'}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Fond de caisse initial', value: formatCurrency(openingCash, settings.currency), color: 'text-gray-900' },
          { label: 'Espèces encaissées', value: '+' + formatCurrency(cashSalesTotal, settings.currency), color: 'text-emerald-700' },
          { label: 'Total espèces théorique', value: formatCurrency(expectedCashInDrawer, settings.currency), color: 'text-indigo-700' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
            <p className="text-[11px] text-gray-400 mb-1">{item.label}</p>
            <p className={clsx('text-lg font-bold font-mono', item.color)}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Other payments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center justify-between text-gray-600">
          <span>Carte bancaire / CIB</span>
          <span className="font-mono font-semibold text-gray-900">{formatCurrency(cardSalesTotal, settings.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-600">
          <span>Ventes à crédit</span>
          <span className="font-mono font-semibold text-red-600">{formatCurrency(creditSalesTotal, settings.currency)}</span>
        </div>
      </div>

      {/* Reconciliation form */}
      {currentSession?.status !== 'closed' ? (
        <form onSubmit={handleCloseSession} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gray-400" />
            Comptage Physique
          </h3>

          <div className="max-w-sm">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Montant total compté dans le tiroir
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={countedCashStr}
                onChange={(e) => setCountedCashStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xl font-bold font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                {settings.currency}
              </span>
            </div>
          </div>

          {/* Variance */}
          {countedCashStr && (
            <div className={clsx(
              'p-3.5 rounded-xl border flex items-center justify-between text-sm',
              difference === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : difference > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-red-50 border-red-200 text-red-700'
            )}>
              <div className="flex items-center gap-2 font-semibold">
                {difference === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>
                  {difference === 0 ? 'Caisse parfaite — Aucun écart' : difference > 0 ? 'Excédent' : 'Déficit'}
                </span>
              </div>
              <span className="font-mono text-base font-bold">
                {difference > 0 ? '+' : ''}{formatCurrency(difference, settings.currency)}
              </span>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition"
            >
              <Lock className="w-4 h-4" />
              <span>Clôturer la caisse</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="font-semibold text-gray-900">Session clôturée avec succès</h3>
          <p className="text-xs text-gray-500">Le rapport de caisse a été archivé.</p>
        </div>
      )}
    </div>
  );
};