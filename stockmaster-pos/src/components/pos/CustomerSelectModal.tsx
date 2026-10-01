import React, { useState } from 'react';
import { Search, UserCheck, AlertCircle, Plus, Phone } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Customer } from '../../types';
import { usePosStore } from '../../store/posStore';
import { formatCurrency } from '../../lib/formatters';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onOpenCreateCustomer?: () => void;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  customers,
  onOpenCreateCustomer,
}) => {
  const [query, setQuery] = useState('');
  const { setSelectedCustomer, selectedCustomer, settings } = usePosStore();

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.phone && c.phone.includes(query)) ||
      (c.nis_nif && c.nis_nif.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sélectionner un Client [F6]" maxWidth="md">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, NIF..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        {/* Walk-in default client button */}
        <button
          onClick={() => handleSelect(null)}
          className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
            !selectedCustomer
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div>
            <span className="font-bold text-sm block">Client Comptoir (Passager)</span>
            <span className="text-[11px] text-slate-400">Vente directe immédiate</span>
          </div>
          {!selectedCustomer && <UserCheck className="w-5 h-5 text-emerald-400" />}
        </button>

        {/* Customers list */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {filtered
            .filter((c) => c.id !== 'cust-walkin')
            .map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              const hasDebt = cust.current_debt > 0;
              return (
                <div
                  key={cust.id}
                  onClick={() => handleSelect(cust)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm block truncate text-slate-100">
                      {cust.name}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      {cust.phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {cust.phone}
                        </span>
                      )}
                      {cust.nis_nif && <span>{cust.nis_nif}</span>}
                    </div>
                  </div>

                  <div className="text-right ml-3">
                    {hasDebt ? (
                      <span className="text-rose-400 font-bold font-mono text-xs block">
                        Dette : {formatCurrency(cust.current_debt, settings.currency)}
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-xs">À jour</span>
                    )}
                    <span className="text-[10px] text-slate-500 block">
                      Plafond : {formatCurrency(cust.credit_limit, settings.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Quick Add Customer */}
        {onOpenCreateCustomer && (
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                onClose();
                onOpenCreateCustomer();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Créer une nouvelle fiche client</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
