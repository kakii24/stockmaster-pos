import React, { useState } from 'react';
import { Percent, DollarSign } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePosStore } from '../../store/posStore';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../lib/formatters';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose }) => {
  const { globalDiscount, setGlobalDiscount, settings } = usePosStore();
  const { subtotalHt } = useCart();
  const [val, setVal] = useState<string>(globalDiscount > 0 ? globalDiscount.toString() : '');
  const [mode, setMode] = useState<'amount' | 'percent'>('amount');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(val) || 0;
    if (mode === 'percent') {
      const calculated = (subtotalHt * num) / 100;
      setGlobalDiscount(calculated);
    } else {
      setGlobalDiscount(num);
    }
    onClose();
  };

  const handleRemove = () => {
    setGlobalDiscount(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Appliquer une Remise Globale [F8]" maxWidth="sm">
      <form onSubmit={handleApply} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('amount')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
              mode === 'amount'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Montant Fixe ({settings.currency})
          </button>
          <button
            type="button"
            onClick={() => setMode('percent')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
              mode === 'percent'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Pourcentage (%)
          </button>
        </div>

        <div className="relative">
          <input
            type="number"
            step="any"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xl font-bold font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={mode === 'percent' ? 'Ex: 10%' : 'Ex: 500 DA'}
            autoFocus
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
            {mode === 'percent' ? '%' : settings.currency}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2">
          {globalDiscount > 0 ? (
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Supprimer la remise
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow transition"
            >
              Appliquer
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
