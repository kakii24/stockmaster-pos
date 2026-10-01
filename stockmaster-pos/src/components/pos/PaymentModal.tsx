import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, FileText, Clock, Printer, Coins, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePosStore } from '../../store/posStore';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../lib/formatters';
import clsx from 'clsx';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessSale: (paymentData: {
    paymentMethod: 'cash' | 'card' | 'check' | 'credit' | 'mixed';
    paidAmount: number;
    printReceipt: boolean;
    openDrawer: boolean;
    notes?: string;
  }) => void;
  isProcessing?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onProcessSale,
  isProcessing = false,
}) => {
  const { selectedCustomer, settings } = usePosStore();
  const { totalTtcWithoutTimbre, totalTtcCash, timbreCash } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'check' | 'credit'>('cash');
  const [tenderAmountStr, setTenderAmountStr] = useState<string>('');
  const [printReceipt, setPrintReceipt] = useState<boolean>(true);
  const [openDrawer, setOpenDrawer] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const requiredAmount = paymentMethod === 'cash' ? totalTtcCash : totalTtcWithoutTimbre;

  useEffect(() => {
    if (isOpen) {
      setTenderAmountStr(requiredAmount.toString());
      setNotes('');
    }
  }, [isOpen, requiredAmount]);

  const numericTender = parseFloat(tenderAmountStr) || 0;
  const changeToReturn = Math.max(0, numericTender - requiredAmount);

  const isCredit = paymentMethod === 'credit';
  const customerDebt = selectedCustomer?.current_debt || 0;
  const customerLimit = selectedCustomer?.credit_limit || 0;
  const newProjectedDebt = customerDebt + (requiredAmount - numericTender);
  const isOverCreditLimit = isCredit && customerLimit > 0 && newProjectedDebt > customerLimit;

  const handleQuickAdd = (add: number) => {
    const cur = parseFloat(tenderAmountStr) || 0;
    setTenderAmountStr((cur + add).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericTender < requiredAmount && !isCredit) {
      alert('Le montant versé est inférieur au montant total de la vente !');
      return;
    }

    onProcessSale({
      paymentMethod,
      paidAmount: isCredit ? numericTender : Math.max(numericTender, requiredAmount),
      printReceipt,
      openDrawer,
      notes: notes.trim() || undefined,
    });
  };

  const paymentMethods = [
    { id: 'cash', label: 'Espèces', icon: Banknote },
    { id: 'card', label: 'Carte / CIB', icon: CreditCard },
    { id: 'check', label: 'Chèque', icon: FileText },
    { id: 'credit', label: 'À Crédit', icon: Clock },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Encaissement" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Total display */}
        <div className="bg-indigo-600 rounded-xl px-5 py-4 flex items-center justify-between text-white">
          <div>
            <span className="text-xs font-medium text-indigo-200 block">Total à payer</span>
            {paymentMethod === 'cash' && timbreCash > 0 && (
              <span className="text-[11px] text-indigo-300">dont {formatCurrency(timbreCash, settings.currency)} timbre</span>
            )}
          </div>
          <span className="text-3xl font-bold font-mono">
            {formatCurrency(requiredAmount, settings.currency)}
          </span>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-4 gap-2">
          {paymentMethods.map((m) => {
            const Icon = m.icon;
            const isSelected = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id as any)}
                className={clsx(
                  'flex flex-col items-center justify-center py-3 rounded-xl border text-xs font-medium transition gap-1.5',
                  isSelected
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                )}
              >
                <Icon className={clsx('w-5 h-5', isSelected ? 'text-indigo-600' : 'text-gray-400')} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Credit warning */}
        {isCredit && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Vente à crédit : {selectedCustomer ? selectedCustomer.name : 'Client requis'}</span>
            </div>
            {!selectedCustomer ? (
              <p className="text-red-600 font-medium">Veuillez sélectionner un client identifié pour accorder un crédit.</p>
            ) : (
              <div className="flex justify-between text-[11px] text-amber-700">
                <span>Dette actuelle : {formatCurrency(customerDebt, settings.currency)}</span>
                <span>Plafond : {formatCurrency(customerLimit, settings.currency)}</span>
              </div>
            )}
            {isOverCreditLimit && (
              <p className="text-red-600 font-medium">Plafond de crédit dépassé avec cette vente !</p>
            )}
          </div>
        )}

        {/* Amount input */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {isCredit ? 'Acompte versé' : 'Montant reçu'}
            </label>
            <button
              type="button"
              onClick={() => setTenderAmountStr(requiredAmount.toString())}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Montant exact
            </button>
          </div>

          <div className="relative">
            <input
              type="number"
              step="any"
              value={tenderAmountStr}
              onChange={(e) => setTenderAmountStr(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-2xl font-bold font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              placeholder="0.00"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
              {settings.currency}
            </span>
          </div>

          {/* Quick cash buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-mono font-medium transition"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Change to return */}
        {!isCredit && changeToReturn > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-semibold">Monnaie à rendre</span>
            </div>
            <span className="text-xl font-bold text-emerald-700 font-mono">
              {formatCurrency(changeToReturn, settings.currency)}
            </span>
          </div>
        )}

        {/* Options */}
        <div className="flex items-center gap-6 text-xs text-gray-600 py-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
            />
            <Printer className="w-3.5 h-3.5 text-gray-400" />
            <span>Imprimer ticket</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={openDrawer}
              onChange={(e) => setOpenDrawer(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
            />
            <Banknote className="w-3.5 h-3.5 text-gray-400" />
            <span>Ouvrir tiroir</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isProcessing || (isCredit && !selectedCustomer) || isOverCreditLimit}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isProcessing ? 'Enregistrement...' : 'Valider & Clôturer'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};