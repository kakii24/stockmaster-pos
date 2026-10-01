import React from 'react';
import { PauseCircle, UserCircle, ChevronDown } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

const VIEW_LABELS: Record<string, string> = {
  pos: 'Caisse & Point de Vente',
  inventory: 'Gestion du Stock',
  customers: 'Clients & Créances',
  reports: 'Rapports & Analyses',
  settings: 'Paramètres',
};

interface HeaderProps {
  onOpenShortcuts: () => void;
  onOpenHeldTickets: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcuts, onOpenHeldTickets }) => {
  const { heldTickets, saleType, toggleSaleType, activeView } = usePosStore();
  const { currentUser } = useAuthStore();

  return (
    <header className="h-12 bg-white border-b border-gray-200 px-5 flex items-center justify-between shrink-0 select-none">
      {/* Left: Page title */}
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-gray-800">
          {VIEW_LABELS[activeView] || 'StockMaster'}
        </h2>

        {/* Sale type toggle — visible only on POS */}
        {activeView === 'pos' && (
          <button
            onClick={toggleSaleType}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition',
              saleType === 'wholesale'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            )}
          >
            <span>{saleType === 'wholesale' ? 'Tarif Gros' : 'Tarif Détail'}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Held tickets */}
        {heldTickets.length > 0 && (
          <button
            onClick={onOpenHeldTickets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>En attente ({heldTickets.length})</span>
          </button>
        )}

        {/* User */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <UserCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight">
              {currentUser?.name || 'Administrateur'}
            </p>
            <p className="text-[10px] text-gray-400 capitalize">{currentUser?.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};