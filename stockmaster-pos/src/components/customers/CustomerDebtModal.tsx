import React, { useState } from 'react';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Customer } from '../../types';
import { usePosStore } from '../../store/posStore';
import { formatCurrency } from '../../lib/formatters';

interface CustomerDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onConfirmPayment: (customerId: string, amount: number) => void;
}

export const CustomerDebtModal: React.FC<CustomerDebtModalProps> = ({
  isOpen,
  onClose,
  customer,
  onConfirmPayment,
}) => {
  const { settings } = usePosStore();
  const [amountStr, setAmountStr] = useState('');

  if (!customer) return null;

  const numericAmount = parseFloat(amountStr) || 0;
  const remaining = Math.max(0, customer.current_debt - numericAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return alert('Veuillez saisir un montant valide !');
    onConfirmPayment(customer.id, numericAmount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Encaisser Versement - ${customer.name}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Dette actuelle :</span>
          <span className="text-xl font-bold font-mono text-rose-400 block">
            {formatCurrency(customer.current_debt, settings.currency)}
          </span>
        </div>

        <Input
          label="Montant du Versement / Règlement"
          type="number"
          step="any"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          suffixText={settings.currency}
          placeholder="0.00"
          required
          autoFocus
        />

        <div className="flex justify-between items-center text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <span>Nouveau solde restant :</span>
          <span className="font-mono font-bold text-slate-200">
            {formatCurrency(remaining, settings.currency)}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Valider l'Encaissement</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
