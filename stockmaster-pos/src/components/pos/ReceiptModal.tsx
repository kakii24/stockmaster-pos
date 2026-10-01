import React from 'react';
import { Printer, Download, Check, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Sale } from '../../types';
import { usePosStore } from '../../store/posStore';
import { EscPosReceiptFormatter } from '../../lib/escpos-builder';
import { api } from '../../api';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onOpenA4?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  onOpenA4,
}) => {
  const { settings } = usePosStore();

  if (!sale) return null;

  const is80mm = settings.printer_type === 'escpos_80mm';
  const formatter = new EscPosReceiptFormatter(is80mm);
  const lines = formatter.generateLines(sale, settings);

  const handlePrint = async () => {
    try {
      await api.printReceipt(sale, is80mm, true);
      alert('Ticket envoyé à l\'imprimante ticket thermique !');
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aperçu Ticket de Caisse (ESC/POS)"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {onOpenA4 && (
            <button
              onClick={() => {
                onClose();
                onOpenA4();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 rounded-lg transition"
            >
              <FileText className="w-4 h-4" />
              <span>Voir Facture A4</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition"
            >
              Fermer
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-950 transition"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Imprimer Ticket</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center">
        {/* Thermal Receipt Paper Visual Container */}
        <div
          className={`w-full ${
            is80mm ? 'max-w-[340px]' : 'max-w-[260px]'
          } bg-amber-50/95 text-slate-950 font-mono text-[11px] p-5 rounded shadow-2xl border border-amber-200/60 transition select-text leading-tight`}
        >
          {lines.map((l, index) => {
            if (l.isBarcode) {
              return (
                <div key={index} className="my-3 text-center">
                  <div className="h-9 bg-slate-900 mx-auto flex items-center justify-center text-white text-[10px] tracking-widest font-mono">
                    ||||||||||||||||||||||||||||||||||||||||
                  </div>
                  <span className="text-[10px] text-slate-600 tracking-wider mt-0.5 block">
                    *{l.text}*
                  </span>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`${
                  l.align === 'center'
                    ? 'text-center'
                    : l.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${l.bold ? 'font-bold' : ''} ${
                  l.size === 'title'
                    ? 'text-sm font-black tracking-tight my-1'
                    : l.size === 'large'
                    ? 'text-xs font-extrabold my-0.5'
                    : ''
                }`}
              >
                {l.text}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
