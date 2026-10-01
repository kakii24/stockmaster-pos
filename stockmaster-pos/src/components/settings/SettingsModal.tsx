import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Printer, Store, DollarSign } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { Input } from '../common/Input';
import { StoreSettings } from '../../types';

export const SettingsModal: React.FC = () => {
  const { settings, updateSettings } = usePosStore();
  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-950/40">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Paramètres de l'Établissement & Caisse</span>
          </h2>
          <p className="text-xs text-slate-400">
            Coordonnées légales, fiscalité (TVA & Timbre fiscal), devises et imprimantes
          </p>
        </div>

        {isSaved && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Paramètres enregistrés avec succès !</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Identité de l'Établissement (Facturation)</span>
            </h3>

            <Input
              label="Nom commercial / Raison Sociale"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Téléphone"
                value={form.store_phone}
                onChange={(e) => setForm({ ...form, store_phone: e.target.value })}
              />
              <Input
                label="Identifiants Fiscaux (NIF / NIS / RC)"
                value={form.store_nif_nis}
                onChange={(e) => setForm({ ...form, store_nif_nis: e.target.value })}
              />
            </div>

            <Input
              label="Adresse de l'Établissement"
              value={form.store_address}
              onChange={(e) => setForm({ ...form, store_address: e.target.value })}
            />
          </div>

          {/* Currency & Tax */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Devise & Régime Fiscal</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Devise Principale
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="DZD">Dinar Algérien (DZD - DA)</option>
                  <option value="EUR">Euro (EUR - €)</option>
                </select>
              </div>

              <Input
                label="Taux TVA Standard par défaut (%)"
                type="number"
                step="any"
                value={form.default_tva}
                onChange={(e) => setForm({ ...form, default_tva: parseFloat(e.target.value) || 0 })}
                suffixText="%"
              />
            </div>

            {/* Timbre Fiscal Section */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Droit de Timbre Fiscal (Ventes en Espèces)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Application automatique de 1% pour les règlements en espèces (min 10 DA, max 2500 DA)
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enable_timbre_fiscal}
                    onChange={(e) => setForm({ ...form, enable_timbre_fiscal: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {form.enable_timbre_fiscal && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Input
                    label="Taux (%)"
                    type="number"
                    step="any"
                    value={form.timbre_fiscal_rate}
                    onChange={(e) =>
                      setForm({ ...form, timbre_fiscal_rate: parseFloat(e.target.value) || 0 })
                    }
                    suffixText="%"
                  />
                  <Input
                    label="Plafond Minimum"
                    type="number"
                    value={form.timbre_fiscal_min}
                    onChange={(e) =>
                      setForm({ ...form, timbre_fiscal_min: parseFloat(e.target.value) || 0 })
                    }
                    suffixText={form.currency}
                  />
                  <Input
                    label="Plafond Maximum"
                    type="number"
                    value={form.timbre_fiscal_max}
                    onChange={(e) =>
                      setForm({ ...form, timbre_fiscal_max: parseFloat(e.target.value) || 0 })
                    }
                    suffixText={form.currency}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Printer & Hardware */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimante & Tickets de Caisse</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Format Imprimante Ticket
                </label>
                <select
                  value={form.printer_type}
                  onChange={(e) => setForm({ ...form, printer_type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="escpos_80mm">Thermique 80mm (ESC/POS Standard)</option>
                  <option value="escpos_58mm">Thermique 58mm (Format Compact)</option>
                  <option value="system">Imprimante Windows Standard (A4)</option>
                </select>
              </div>

              <Input
                label="Message pied de ticket"
                value={form.receipt_footer}
                onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
                placeholder="Ex: Merci de votre visite !"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-950 transition"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Enregistrer les Paramètres</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
