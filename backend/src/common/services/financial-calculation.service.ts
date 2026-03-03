import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';

export interface ProductCostBreakdown {
  advertisingCost: number;
  vat: number;
  totalLandedCost: number;
}

export interface DealFinancials {
  revenue: number;
  cost: number;
  adSpend: number;
  vat: number;
  grossProfit: number;
  profitMarginPercent: number;
}

export interface BulkPricingEntry {
  minQuantity: number;
  bulkCostPrice: number | string | Decimal;
}

@Injectable()
export class FinancialCalculationService {
  /**
   * Calculate product cost components for a single unit.
   * VAT is applied on top of (baseCost + adCost).
   */
  calculateProductCosts(
    baseCost: number | string | Decimal,
    vatPercent: number | string | Decimal,
    adPercent: number | string | Decimal,
  ): ProductCostBreakdown {
    const base = new Decimal(baseCost.toString());
    const vat = new Decimal(vatPercent.toString()).div(100);
    const ad = new Decimal(adPercent.toString()).div(100);

    const advertisingCost = base.mul(ad);
    const subTotal = base.plus(advertisingCost);
    const vatAmount = subTotal.mul(vat);
    const totalLandedCost = subTotal.plus(vatAmount);

    return {
      advertisingCost: parseFloat(advertisingCost.toFixed(4)),
      vat: parseFloat(vatAmount.toFixed(4)),
      totalLandedCost: parseFloat(totalLandedCost.toFixed(4)),
    };
  }

  /**
   * Determine effective cost price based on quantity and bulk pricing tiers.
   * Returns the bulkCostPrice of the highest applicable tier,
   * or the baseCostPrice if no tier applies.
   */
  getBulkPrice(
    quantity: number,
    baseCostPrice: number | string | Decimal,
    bulkPricings: BulkPricingEntry[],
  ): number {
    const sorted = [...bulkPricings].sort((a, b) => b.minQuantity - a.minQuantity);
    const applicable = sorted.find((bp) => quantity >= bp.minQuantity);
    if (applicable) {
      return parseFloat(new Decimal(applicable.bulkCostPrice.toString()).toFixed(4));
    }
    return parseFloat(new Decimal(baseCostPrice.toString()).toFixed(4));
  }

  /**
   * Calculate all deal financials.
   *  - revenue     = salePrice * quantity
   *  - cost        = effectiveCostPrice * quantity
   *  - adSpend     = cost * (adPercent / 100)
   *  - vat         = (cost + adSpend) * (vatPercent / 100)
   *  - grossProfit = revenue - cost - adSpend - vat
   *  - margin%     = (grossProfit / revenue) * 100
   */
  calculateDealFinancials(
    salePrice: number | string | Decimal,
    quantity: number,
    costPrice: number | string | Decimal,
    adPercent: number | string | Decimal,
    vatPercent: number | string | Decimal,
  ): DealFinancials {
    const sp = new Decimal(salePrice.toString());
    const qty = new Decimal(quantity);
    const cp = new Decimal(costPrice.toString());
    const ad = new Decimal(adPercent.toString()).div(100);
    const vat = new Decimal(vatPercent.toString()).div(100);

    const revenue = sp.mul(qty);
    const cost = cp.mul(qty);
    const adSpend = cost.mul(ad);
    const vatAmount = cost.plus(adSpend).mul(vat);
    const grossProfit = revenue.minus(cost).minus(adSpend).minus(vatAmount);
    const profitMarginPercent = revenue.isZero()
      ? new Decimal(0)
      : grossProfit.div(revenue).mul(100);

    return {
      revenue: parseFloat(revenue.toFixed(4)),
      cost: parseFloat(cost.toFixed(4)),
      adSpend: parseFloat(adSpend.toFixed(4)),
      vat: parseFloat(vatAmount.toFixed(4)),
      grossProfit: parseFloat(grossProfit.toFixed(4)),
      profitMarginPercent: parseFloat(profitMarginPercent.toFixed(4)),
    };
  }
}
