import { Sale, StoreSettings } from '../types';
import { formatCurrency, formatDateTime } from './formatters';

export interface FormattedReceiptLine {
  text: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  size?: 'normal' | 'large' | 'title';
  isBarcode?: boolean;
}

export class EscPosReceiptFormatter {
  private is80mm: boolean;
  private lineWidth: number;

  constructor(is80mm: boolean = true) {
    this.is80mm = is80mm;
    this.lineWidth = is80mm ? 48 : 32;
  }

  generateLines(sale: Sale, settings: StoreSettings): FormattedReceiptLine[] {
    const lines: FormattedReceiptLine[] = [];
    const sep = '-'.repeat(this.lineWidth);
    const dsep = '='.repeat(this.lineWidth);

    // Header
    lines.push({ text: settings.store_name, align: 'center', bold: true, size: 'title' });
    lines.push({ text: 'COMMERCE DE GROS & DETAIL', align: 'center', bold: false });
    if (settings.store_address) lines.push({ text: settings.store_address, align: 'center' });
    if (settings.store_phone) lines.push({ text: `Tél: ${settings.store_phone}`, align: 'center' });
    if (settings.store_nif_nis) lines.push({ text: settings.store_nif_nis, align: 'center' });
    lines.push({ text: sep, align: 'center' });

    // Ticket details
    lines.push({ text: this.padRow('Ticket N°:', sale.invoice_number), align: 'left' });
    lines.push({ text: this.padRow('Date:', formatDateTime(sale.created_at)), align: 'left' });
    lines.push({
      text: this.padRow('Client:', sale.customer_name || 'Client Comptoir'),
      align: 'left',
    });
    lines.push({
      text: this.padRow('Tarif:', sale.sale_type === 'wholesale' ? 'GROS' : 'DETAIL'),
      align: 'left',
    });
    lines.push({ text: sep, align: 'center' });

    // Table Header
    if (this.is80mm) {
      lines.push({ text: this.padRow('Désignation          Qté x P.U', 'Total TTC'), bold: true });
    } else {
      lines.push({ text: this.padRow('Article       Qté x P.U', 'Total'), bold: true });
    }
    lines.push({ text: sep, align: 'center' });

    // Items
    for (const item of sale.items) {
      lines.push({ text: item.product_name, bold: true });
      const qtyPrice = `  ${item.quantity} x ${formatCurrency(item.unit_price_ht, settings.currency)}`;
      const totalStr = formatCurrency(item.total_ttc, settings.currency);
      lines.push({ text: this.padRow(qtyPrice, totalStr) });
    }

    lines.push({ text: dsep, align: 'center' });

    // Totals
    lines.push({
      text: this.padRow('Total HT:', formatCurrency(sale.subtotal_ht, settings.currency)),
    });
    if (sale.discount_amount > 0) {
      lines.push({
        text: this.padRow('Remise:', `-${formatCurrency(sale.discount_amount, settings.currency)}`),
      });
    }
    lines.push({
      text: this.padRow('Total TVA:', formatCurrency(sale.tax_tva, settings.currency)),
    });
    if (sale.timbre_fiscal > 0) {
      lines.push({
        text: this.padRow('Timbre Fiscal (1%):', formatCurrency(sale.timbre_fiscal, settings.currency)),
      });
    }

    lines.push({ text: sep, align: 'center' });
    lines.push({
      text: this.padRow('NET A PAYER:', formatCurrency(sale.total_ttc, settings.currency)),
      bold: true,
      size: 'large',
    });
    lines.push({ text: sep, align: 'center' });

    // Payment Info
    const pMethod = {
      cash: 'Espèces',
      card: 'Carte Bancaire / CIB',
      check: 'Chèque',
      credit: 'À Crédit',
      mixed: 'Mixte',
    }[sale.payment_method] || sale.payment_method;

    lines.push({ text: this.padRow('Paiement:', pMethod) });
    lines.push({
      text: this.padRow('Montant Reçu:', formatCurrency(sale.paid_amount, settings.currency)),
    });
    if (sale.change_amount > 0) {
      lines.push({
        text: this.padRow('Rendu Monnaie:', formatCurrency(sale.change_amount, settings.currency)),
      });
    }

    lines.push({ text: sep, align: 'center' });
    lines.push({ text: sale.invoice_number, align: 'center', isBarcode: true });
    lines.push({ text: settings.receipt_footer || 'Merci de votre visite !', align: 'center' });
    lines.push({ text: 'Les retours sont acceptés sous 48h avec ticket.', align: 'center' });

    return lines;
  }

  private padRow(left: string, right: string): string {
    const leftLen = left.length;
    const rightLen = right.length;
    if (leftLen + rightLen >= this.lineWidth) {
      const maxLeft = this.lineWidth - rightLen - 1;
      return `${left.slice(0, maxLeft)} ${right}`;
    }
    const spaces = ' '.repeat(this.lineWidth - (leftLen + rightLen));
    return `${left}${spaces}${right}`;
  }
}
