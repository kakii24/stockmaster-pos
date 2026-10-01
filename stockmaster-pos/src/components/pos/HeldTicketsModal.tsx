import React from 'react';
import { Play, Trash2, Clock, ShoppingBag } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePosStore } from '../../store/posStore';
import { formatCurrency, formatDateTime } from '../../lib/formatters';

interface HeldTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldTicketsModal: React.FC<HeldTicketsModalProps> = ({ isOpen, onClose }) => {
  const { heldTickets, restoreHeldTicket, deleteHeldTicket, settings } = usePosStore();

  const handleRestore = (id: string) => {
    restoreHeldTicket(id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tickets en Attente [F10]" maxWidth="md">
      <div className="space-y-3">
        {heldTickets.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">Aucun ticket en attente.</p>
          </div>
        ) : (
          heldTickets.map((t) => {
            const total = t.cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
            return (
              <div
                key={t.id}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{t.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatDateTime(t.timestamp)}
                    </span>
                    <span>·</span>
                    <span>{t.cart.length} article(s)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 mt-1 block">
                    {formatCurrency(total, settings.currency)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteHeldTicket(t.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRestore(t.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Reprendre</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};
