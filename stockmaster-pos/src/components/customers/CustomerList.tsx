import React, { useState, useMemo } from 'react';
import { Search, Plus, Phone, Mail, MapPin, DollarSign, Edit2, Users, TrendingDown, CheckCircle } from 'lucide-react';
import { Customer } from '../../types';
import { usePosStore } from '../../store/posStore';
import { formatCurrency } from '../../lib/formatters';
import clsx from 'clsx';

interface CustomerListProps {
  customers: Customer[];
  onOpenCreateCustomer: () => void;
  onOpenEditCustomer: (customer: Customer) => void;
  onOpenPayDebt: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onOpenCreateCustomer,
  onOpenEditCustomer,
  onOpenPayDebt,
}) => {
  const { settings } = usePosStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter(
      (c) =>
        q === '' ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.nis_nif && c.nis_nif.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const totalOutstandingDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.current_debt || 0), 0);
  }, [customers]);

  return (
    <div className="flex-1 flex flex-col p-5 overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Clients & Créances</h2>
          <p className="text-xs text-gray-500 mt-0.5">Suivi des soldes, plafonds et paiements</p>
        </div>

        <button
          onClick={onOpenCreateCustomer}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total clients', value: customers.length, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Créances en cours', value: formatCurrency(totalOutstandingDebt, settings.currency), icon: TrendingDown, color: 'bg-red-50 text-red-600' },
          { label: 'Clients à jour', value: customers.filter((c) => c.current_debt === 0).length, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm flex items-center gap-3">
              <div className={clsx('p-2 rounded-lg shrink-0', card.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{card.label}</p>
                <p className="text-sm font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-3 max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone, NIF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold sticky top-0 z-10 border-b border-gray-200">
            <tr>
              <th className="py-2.5 px-4">Client</th>
              <th className="py-2.5 px-4">Contact</th>
              <th className="py-2.5 px-4">NIS/NIF</th>
              <th className="py-2.5 px-4 text-right">Plafond crédit</th>
              <th className="py-2.5 px-4 text-right">Solde débiteur</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  Aucun client trouvé.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const hasDebt = c.current_debt > 0;
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition group">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900 block">{c.name}</span>
                      {c.address && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {c.address}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-500">
                      {c.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="font-mono">{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">{c.nis_nif || '—'}</td>

                    <td className="py-3 px-4 text-right font-mono text-gray-500">
                      {formatCurrency(c.credit_limit, settings.currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {hasDebt ? (
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          {formatCurrency(c.current_debt, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-emerald-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                        {hasDebt && (
                          <button
                            onClick={() => onOpenPayDebt(c)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-[11px] transition"
                            title="Encaisser un versement"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Régler</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenEditCustomer(c)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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