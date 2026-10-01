import { StoreSettings } from '../types';

/**
 * Format currency according to French / Algerian standards (fr-FR locale).
 * e.g., 1250.5 -> "1 250,50 DA" or "1 250,50 €"
 */
export function formatCurrency(amount: number | null | undefined, currency: 'DZD' | 'EUR' = 'DZD'): string {
  const val = amount ?? 0;
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

  return currency === 'DZD' ? `${formatted} DA` : `${formatted} €`;
}

/**
 * Format date to standard French format DD/MM/YYYY
 */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date & time to DD/MM/YYYY HH:mm:ss
 */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

/**
 * Format quantity or generic number
 */
export function formatNumber(val: number | null | undefined, decimals = 2): string {
  const v = val ?? 0;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals === 0 ? 0 : 0,
    maximumFractionDigits: decimals,
  }).format(v);
}

/**
 * Calculate Algerian Timbre Fiscal for cash payment transactions
 * Standard: 1% with min 10 DZD and max 2,500 DZD
 */
export function calculateTimbreFiscal(
  totalTtcBeforeTimbre: number,
  paymentMethod: string,
  settings: StoreSettings
): number {
  if (!settings.enable_timbre_fiscal || paymentMethod !== 'cash') {
    return 0;
  }

  if (totalTtcBeforeTimbre <= 0) return 0;

  const rate = (settings.timbre_fiscal_rate || 1.0) / 100.0;
  let timbre = Math.ceil(totalTtcBeforeTimbre * rate);

  if (settings.currency === 'DZD') {
    const min = settings.timbre_fiscal_min ?? 10.0;
    const max = settings.timbre_fiscal_max ?? 2500.0;
    timbre = Math.max(min, Math.min(max, timbre));
  }

  return timbre;
}

/**
 * Convert number to French text for legal A4 Facture mention:
 * "Arrêtée la présente facture à la somme de..."
 */
export function numberToFrenchWords(amount: number, currency: 'DZD' | 'EUR' = 'DZD'): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  const convertPart = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 70) {
      const ten = Math.floor(n / 10);
      const rem = n % 10;
      if (rem === 1) return `${tens[ten]} et un`;
      return rem > 0 ? `${tens[ten]}-${units[rem]}` : tens[ten];
    }
    if (n < 80) {
      const rem = n - 60;
      if (rem === 11) return 'soixante et onze';
      return `soixante-${convertPart(rem)}`;
    }
    if (n < 100) {
      const rem = n - 80;
      if (rem === 0) return 'quatre-vingts';
      return `quatre-vingt-${convertPart(rem)}`;
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rem = n % 100;
      const hStr = hundred === 1 ? 'cent' : `${units[hundred]} cents`;
      return rem > 0 ? `${hundred === 1 ? 'cent' : `${units[hundred]} cent`} ${convertPart(rem)}` : hStr;
    }
    if (n < 1000000) {
      const thousand = Math.floor(n / 1000);
      const rem = n % 1000;
      const tStr = thousand === 1 ? 'mille' : `${convertPart(thousand)} mille`;
      return rem > 0 ? `${tStr} ${convertPart(rem)}` : tStr;
    }
    const million = Math.floor(n / 1000000);
    const rem = n % 1000000;
    const mStr = million === 1 ? 'un million' : `${convertPart(million)} millions`;
    return rem > 0 ? `${mStr} ${convertPart(rem)}` : mStr;
  };

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  const curName = currency === 'DZD' ? 'dinars algériens' : 'euros';
  const centName = currency === 'DZD' ? 'centimes' : 'centimes';

  const intWords = integerPart === 0 ? 'zéro' : convertPart(integerPart);
  const decWords = decimalPart > 0 ? ` et ${convertPart(decimalPart)} ${centName}` : '';

  return `${intWords} ${curName}${decWords}`.toUpperCase();
}
