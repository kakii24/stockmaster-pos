import React from 'react';
import { ShoppingCart, Boxes, Users, BarChart3, Settings, Store } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { ActiveView } from '../../types';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, heldTickets } = usePosStore();

  const navItems: { id: ActiveView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'pos', label: 'Caisse', icon: ShoppingCart, badge: heldTickets.length > 0 ? heldTickets.length : undefined },
    { id: 'inventory', label: 'Stock', icon: Boxes },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'reports', label: 'Rapports', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 select-none shadow-sm">
      {/* Brand */}
      <div>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-gray-900 leading-tight">
              StockMaster
            </h1>
            <p className="text-[11px] text-gray-400">Point de Vente</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      'w-4 h-4',
                      isActive ? 'text-indigo-600' : 'text-gray-400'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="text-[11px] text-gray-400 truncate">StockMaster v1.0</span>
        </div>
      </div>
    </aside>
  );
};