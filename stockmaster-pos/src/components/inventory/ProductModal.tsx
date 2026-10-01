import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Category, Product } from '../../types';
import { usePosStore } from '../../store/posStore';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product | null;
  categories: Category[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
}) => {
  const { settings } = usePosStore();

  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [retailPrice, setRetailPrice] = useState('0');
  const [wholesalePrice, setWholesalePrice] = useState('0');
  const [minWholesaleQty, setMinWholesaleQty] = useState('5');
  const [currentStock, setCurrentStock] = useState('0');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [unit, setUnit] = useState('U');
  const [tvaRate, setTvaRate] = useState(settings.default_tva.toString());

  useEffect(() => {
    if (product) {
      setBarcode(product.barcode);
      setName(product.name);
      setCategoryId(product.category_id || '');
      setCostPrice(product.cost_price.toString());
      setRetailPrice(product.retail_price.toString());
      setWholesalePrice(product.wholesale_price.toString());
      setMinWholesaleQty(product.min_wholesale_quantity.toString());
      setCurrentStock(product.current_stock.toString());
      setMinStockAlert(product.min_stock_alert.toString());
      setUnit(product.unit);
      setTvaRate(product.tva_rate.toString());
    } else {
      setBarcode(Math.floor(613000000000 + Math.random() * 999999999).toString());
      setName('');
      setCategoryId(categories[0]?.id || '');
      setCostPrice('0');
      setRetailPrice('0');
      setWholesalePrice('0');
      setMinWholesaleQty('5');
      setCurrentStock('0');
      setMinStockAlert('5');
      setUnit('U');
      setTvaRate(settings.default_tva.toString());
    }
  }, [product, categories, isOpen, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Le nom de l\'article est obligatoire !');
    if (!barcode.trim()) return alert('Le code-barres est obligatoire !');

    const cat = categories.find((c) => c.id === categoryId);

    const saved: Product = {
      id: product?.id || '',
      barcode: barcode.trim(),
      name: name.trim(),
      category_id: categoryId || null,
      category_name: cat?.name || null,
      cost_price: parseFloat(costPrice) || 0,
      retail_price: parseFloat(retailPrice) || 0,
      wholesale_price: parseFloat(wholesalePrice) || 0,
      min_wholesale_quantity: parseFloat(minWholesaleQty) || 1,
      current_stock: parseFloat(currentStock) || 0,
      min_stock_alert: parseFloat(minStockAlert) || 5,
      unit: unit.trim() || 'U',
      tva_rate: parseFloat(tvaRate) || 0,
      is_active: true,
      created_at: product?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(saved);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Modifier l\'Article' : 'Ajouter un Nouvel Article'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Code-Barres EAN / Manuel"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            required
          />
          <Input
            label="Désignation de l'Article"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Huile d'olive 1L"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Catégorie
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">(Aucune catégorie)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Unité"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="U, Kg, L, Carton..."
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Taux TVA
            </label>
            <select
              value={tvaRate}
              onChange={(e) => setTvaRate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            >
              <option value="0">0% (Exonéré)</option>
              <option value="9">9% (Taux Réduit)</option>
              <option value="19">19% (Taux Normal DZ)</option>
              <option value="20">20% (Taux Normal FR)</option>
              <option value="5.5">5.5% (Taux Réduit FR)</option>
              <option value="10">10% (Taux Intermédiaire FR)</option>
            </select>
          </div>
        </div>

        {/* Pricing Matrix */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 block">
            Grille Tarifaire ({settings.currency})
          </span>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Prix d'Achat HT (Coût)"
              type="number"
              step="any"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              suffixText={settings.currency}
            />
            <Input
              label="Prix Vente Détail TTC"
              type="number"
              step="any"
              value={retailPrice}
              onChange={(e) => setRetailPrice(e.target.value)}
              suffixText={settings.currency}
              required
            />
            <Input
              label="Prix Vente Gros TTC"
              type="number"
              step="any"
              value={wholesalePrice}
              onChange={(e) => setWholesalePrice(e.target.value)}
              suffixText={settings.currency}
              required
            />
          </div>
        </div>

        {/* Stock management */}
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Stock Actuel"
            type="number"
            step="any"
            value={currentStock}
            onChange={(e) => setCurrentStock(e.target.value)}
            disabled={!!product} // for existing products, use movement modal for audit trail
          />
          <Input
            label="Seuil Alerte Stock"
            type="number"
            step="any"
            value={minStockAlert}
            onChange={(e) => setMinStockAlert(e.target.value)}
          />
          <Input
            label="Qté Min Vente Gros"
            type="number"
            step="any"
            value={minWholesaleQty}
            onChange={(e) => setMinWholesaleQty(e.target.value)}
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
            Enregistrer l'Article
          </button>
        </div>
      </form>
    </Modal>
  );
};
