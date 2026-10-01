import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, AlertOctagon } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Product } from '../../types';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMovement: (data: {
    productId: string;
    movementType: 'reception' | 'adjustment' | 'loss' | 'return';
    quantity: number;
    reason?: string;
    referenceDoc?: string;
  }) => void;
  products: Product[];
  selectedProduct?: Product | null;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  onSaveMovement,
  products,
  selectedProduct,
}) => {
  const [productId, setProductId] = useState('');
  const [movementType, setMovementType] = useState<'reception' | 'adjustment' | 'loss' | 'return'>(
    'reception'
  );
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [refDoc, setRefDoc] = useState('');

  useEffect(() => {
    if (selectedProduct) {
      setProductId(selectedProduct.id);
    } else if (products.length > 0) {
      setProductId(products[0].id);
    }
    setQty('');
    setReason('');
    setRefDoc('');
  }, [selectedProduct, products, isOpen]);

  const currentProd = products.find((p) => p.id === productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericQty = parseFloat(qty);
    if (isNaN(numericQty) || (movementType !== 'adjustment' && numericQty <= 0)) {
      return alert('Veuillez entrer une quantité valide !');
    }

    onSaveMovement({
      productId,
      movementType,
      quantity: numericQty,
      reason: reason.trim() || undefined,
      referenceDoc: refDoc.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enregistrer un Mouvement de Stock" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Article concerné
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock actuel: {p.current_stock} {p.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Movement Type */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'reception', label: 'Entrée (Réception)', icon: ArrowDownLeft, color: 'text-emerald-400' },
            { id: 'loss', label: 'Sortie (Perte/Casse)', icon: AlertOctagon, color: 'text-rose-400' },
            { id: 'adjustment', label: 'Ajustement Inventaire', icon: RefreshCw, color: 'text-sky-400' },
            { id: 'return', label: 'Retour Client', icon: ArrowUpRight, color: 'text-amber-400' },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = movementType === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMovementType(m.id as any)}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${m.color}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quantity */}
        <Input
          label={
            movementType === 'adjustment'
              ? 'Nouveau stock physique réel compté'
              : 'Quantité à ajouter / déduire'
          }
          type="number"
          step="any"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          suffixText={currentProd?.unit || 'U'}
          placeholder="0.00"
          required
          autoFocus
        />

        {/* Reference doc & Reason */}
        <Input
          label="N° Bon de Livraison / Pièce justificative"
          value={refDoc}
          onChange={(e) => setRefDoc(e.target.value)}
          placeholder="Ex: BL-2024-098"
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Motif / Commentaire
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={2}
            placeholder="Ex: Réception commande fournisseur du 28/09..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-lg shadow-emerald-950 transition"
          >
            Valider le mouvement
          </button>
        </div>
      </form>
    </Modal>
  );
};
