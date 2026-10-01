import React from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'F1', desc: 'Afficher cette aide des raccourcis clavier' },
    { key: 'F2', desc: 'Vider le panier en cours / Nouvelle vente' },
    { key: 'F4', desc: 'Basculer le mode tarifaire (Détail / Gros)' },
    { key: 'F6', desc: 'Sélectionner ou changer de client' },
    { key: 'F8', desc: 'Appliquer une remise globale sur le ticket' },
    { key: 'F10', desc: 'Mettre le ticket en attente' },
    { key: 'F12 / Entrée', desc: 'Encaisser la vente (Ouvrir le paiement)' },
    { key: 'Échap', desc: 'Fermer toute boîte de dialogue ou fenêtre modale' },
    { key: 'Douchette Code-barres', desc: 'Scan automatique instantané (< 50ms sans clic préalable)' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raccourcis Clavier Caisse & Douchette" maxWidth="md">
      <div className="space-y-3">
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Le système est optimisé pour une utilisation 100% au clavier ou douchette.</span>
        </div>

        <div className="divide-y divide-slate-800">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
