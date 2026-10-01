import { useMemo } from 'react';
import { usePosStore } from '../store/posStore';
import { calculateTimbreFiscal } from '../lib/formatters';

export function useCart() {
  const { cart, globalDiscount, settings } = usePosStore();

  return useMemo(() => {
    let subtotalHt = 0;
    let totalCost = 0;
    const tvaBreakdown: Record<number, { baseHt: number; amountTva: number }> = {};

    const computedItems = cart.map((item) => {
      const lineTotalRaw = item.unit_price * item.quantity;
      const discountVal = lineTotalRaw * (item.discount_percent / 100);
      const lineHt = Math.max(0, lineTotalRaw - discountVal);
      const lineTva = lineHt * (item.tva_rate / 100);
      const lineTtc = lineHt + lineTva;
      const lineCost = item.product.cost_price * item.quantity;

      subtotalHt += lineHt;
      totalCost += lineCost;

      // Group TVA
      const rate = item.tva_rate;
      if (!tvaBreakdown[rate]) {
        tvaBreakdown[rate] = { baseHt: 0, amountTva: 0 };
      }
      tvaBreakdown[rate].baseHt += lineHt;
      tvaBreakdown[rate].amountTva += lineTva;

      return {
        ...item,
        lineHt,
        lineTva,
        lineTtc,
        lineCost,
      };
    });

    const subtotalAfterGlobalDiscount = Math.max(0, subtotalHt - globalDiscount);
    const totalTva = Object.values(tvaBreakdown).reduce((acc, v) => acc + v.amountTva, 0);

    // Timbre fiscal for cash payments
    const timbreCash = calculateTimbreFiscal(
      subtotalAfterGlobalDiscount + totalTva,
      'cash',
      settings
    );

    const totalTtcWithoutTimbre = subtotalAfterGlobalDiscount + totalTva;
    const totalTtcCash = totalTtcWithoutTimbre + timbreCash;

    const totalUnits = cart.reduce((acc, item) => acc + item.quantity, 0);
    const grossMargin = subtotalAfterGlobalDiscount - totalCost;
    const marginPercent = subtotalAfterGlobalDiscount > 0 ? (grossMargin / subtotalAfterGlobalDiscount) * 100 : 0;

    return {
      items: computedItems,
      totalUnits,
      subtotalHt,
      globalDiscount,
      subtotalAfterGlobalDiscount,
      totalTva,
      tvaBreakdown,
      timbreCash,
      totalTtcWithoutTimbre,
      totalTtcCash,
      totalCost,
      grossMargin,
      marginPercent,
      isEmpty: cart.length === 0,
    };
  }, [cart, globalDiscount, settings]);
}
