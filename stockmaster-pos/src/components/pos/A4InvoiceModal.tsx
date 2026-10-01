import React, { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Sale } from '../../types';
import { usePosStore } from '../../store/posStore';
import { formatCurrency, formatDate, numberToFrenchWords } from '../../lib/formatters';

interface A4InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const A4InvoiceModal: React.FC<A4InvoiceModalProps> = ({
  isOpen,
  onClose,
  sale,
}) => {
  const { settings } = usePosStore();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const words = numberToFrenchWords(sale.total_ttc, settings.currency);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Facture / Bon de Livraison A4"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-950 transition"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Imprimer Facture A4 / Exporter PDF</span>
          </button>
        </div>
      }
    >
      {/* Printable Sheet View */}
      <div
        ref={printAreaRef}
        className="bg-white text-slate-950 p-8 rounded-lg shadow-2xl font-sans text-xs max-w-[210mm] mx-auto select-text"
        id="printable-a4-invoice"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              {settings.store_name}
            </h1>
            <p className="text-slate-600 font-medium">Commerce de Gros & Détail</p>
            <p className="text-slate-600">{settings.store_address}</p>
            <p className="text-slate-600">Tél: {settings.store_phone}</p>
            <p className="text-slate-700 font-mono text-[10px] mt-1">{settings.store_nif_nis}</p>
          </div>

          <div className="text-right">
            <span className="inline-block bg-slate-900 text-white font-black px-4 py-1.5 rounded text-sm uppercase tracking-wider mb-2">
              FACTURE DE VENTE
            </span>
            <p className="font-mono font-bold text-sm text-slate-900">N° {sale.invoice_number}</p>
            <p className="text-slate-600">Date : {formatDate(sale.created_at)}</p>
            <p className="text-slate-600 capitalize">
              Règlement :{' '}
              {sale.payment_method === 'cash'
                ? 'Espèces'
                : sale.payment_method === 'credit'
                ? 'À Crédit'
                : sale.payment_method}
            </p>
          </div>
        </div>

        {/* Client Box */}
        <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-200 flex justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Destinataire / Client :
            </span>
            <p className="font-bold text-sm text-slate-900">
              {sale.customer_name || 'Client Comptoir (Passager)'}
            </p>
            <p className="text-slate-600 text-[11px]">Alger, Algérie</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Régime :
            </span>
            <span className="font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] uppercase">
              {sale.sale_type === 'wholesale' ? 'Vente en Gros' : 'Vente au Détail'}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 text-[11px] font-bold">
              <th className="py-2 px-3">Réf / Code</th>
              <th className="py-2 px-3">Désignation</th>
              <th className="py-2 px-3 text-center">Qté</th>
              <th className="py-2 px-3 text-right">P.U HT</th>
              <th className="py-2 px-3 text-center">Rem%</th>
              <th className="py-2 px-3 text-right">Total HT</th>
              <th className="py-2 px-3 text-center">TVA</th>
              <th className="py-2 px-3 text-right">Total TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sale.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 text-[11px]">
                <td className="py-2 px-3 font-mono text-slate-600">{item.barcode}</td>
                <td className="py-2 px-3 font-medium text-slate-900">{item.product_name}</td>
                <td className="py-2 px-3 text-center font-bold">{item.quantity}</td>
                <td className="py-2 px-3 text-right font-mono">
                  {formatCurrency(item.unit_price_ht, settings.currency)}
                </td>
                <td className="py-2 px-3 text-center font-mono">
                  {item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}
                </td>
                <td className="py-2 px-3 text-right font-mono">
                  {formatCurrency(item.total_ht, settings.currency)}
                </td>
                <td className="py-2 px-3 text-center font-mono">{item.tva_rate}%</td>
                <td className="py-2 px-3 text-right font-bold font-mono">
                  {formatCurrency(item.total_ttc, settings.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Fiscal Recap */}
        <div className="flex justify-between items-start pt-2">
          {/* Legal Spelled Out Text */}
          <div className="max-w-[55%]">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[10px] space-y-1.5">
              <p className="font-bold text-slate-700">Arrêté la présente facture à la somme de :</p>
              <p className="font-bold italic text-slate-900 text-[11px] leading-relaxed">
                « {words} »
              </p>
            </div>
            {sale.notes && (
              <p className="text-[10px] text-slate-500 mt-2 italic">Notes: {sale.notes}</p>
            )}
          </div>

          {/* Totals table */}
          <div className="w-[40%] bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
            <div className="flex justify-between text-slate-700">
              <span>Total Montant HT :</span>
              <span className="font-mono font-medium">
                {formatCurrency(sale.subtotal_ht, settings.currency)}
              </span>
            </div>

            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Remise Globale :</span>
                <span className="font-mono font-medium">
                  -{formatCurrency(sale.discount_amount, settings.currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-700">
              <span>Total TVA :</span>
              <span className="font-mono font-medium">
                {formatCurrency(sale.tax_tva, settings.currency)}
              </span>
            </div>

            {sale.timbre_fiscal > 0 && (
              <div className="flex justify-between text-sky-800">
                <span>Droit de Timbre (1%) :</span>
                <span className="font-mono font-medium">
                  {formatCurrency(sale.timbre_fiscal, settings.currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 text-slate-950 font-black text-sm">
              <span>NET À PAYER (TTC) :</span>
              <span className="font-mono text-base">
                {formatCurrency(sale.total_ttc, settings.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures & Footer */}
        <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-slate-300 text-center text-[11px]">
          <div>
            <p className="font-bold text-slate-800 uppercase mb-16">Le Client / Réceptionnaire</p>
            <p className="text-slate-400 text-[10px] italic">(Signature & Mention "Bon pour Accord")</p>
          </div>
          <div>
            <p className="font-bold text-slate-800 uppercase mb-16">
              Cachet & Signature de l'Établissement
            </p>
            <p className="text-slate-400 text-[10px] italic">{settings.store_name}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
