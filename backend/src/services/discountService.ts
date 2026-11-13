/**
 * CENTRALIZED CGPA DISCOUNT ENGINE
 * 
 * Strict Specification from Phase 3:
 * | Verified CGPA                    | Discount |
 * | -------------------------------- | -------- |
 * | Greater than 9.5                 | 20%      |
 * | Greater than 9.0 and up to 9.5   | 15%      |
 * | Greater than 8.5 and up to 9.0   | 10%      |
 * | 8.5 or below                     | 0%       |
 * 
 * Boundary test cases:
 * - 9.72 = 20%
 * - 9.51 = 20%
 * - 9.50 = 15%
 * - 9.01 = 15%
 * - 9.00 = 10%
 * - 8.51 = 10%
 * - 8.50 = 0%
 * - 8.20 = 0%
 * - Unverified = 0%
 */

export interface PricingBreakdown {
  baseUnitPrice: number;
  baseUnitPricePaise: number;
  quantity: number;
  subtotal: number;
  subtotalPaise: number;
  discountPercentage: number;
  discountAmount: number;
  discountAmountPaise: number;
  finalAmount: number;
  finalAmountPaise: number;
  currency: 'INR';
}

export class DiscountService {
  /**
   * Deterministically calculates the academic discount percentage based on verified CGPA.
   * If unverified or non-student, returns 0.
   */
  public calculateDiscountPercentage(cgpa?: number, isVerified?: boolean): number {
    if (!isVerified || cgpa === undefined || typeof cgpa !== 'number' || isNaN(cgpa)) {
      return 0;
    }

    if (cgpa > 9.5) {
      return 20;
    } else if (cgpa > 9.0) {
      return 15;
    } else if (cgpa > 8.5) {
      return 10;
    } else {
      return 0;
    }
  }

  /**
   * Performs safe integer paise arithmetic for ticket pricing to avoid floating-point errors.
   */
  public computePricing(
    baseUnitPriceINR: number,
    quantity: number,
    cgpa?: number,
    isVerified?: boolean
  ): PricingBreakdown {
    // 1. Ensure clean integer representations in Paise (1 INR = 100 Paise)
    const baseUnitPricePaise = Math.round(baseUnitPriceINR * 100);
    const subtotalPaise = baseUnitPricePaise * quantity;

    // 2. Derive discount percentage strictly from backend parameters
    const discountPercentage = this.calculateDiscountPercentage(cgpa, isVerified);

    // 3. Compute discount amount in Paise with standard rounding
    const discountAmountPaise = Math.round((subtotalPaise * discountPercentage) / 100);
    const finalAmountPaise = subtotalPaise - discountAmountPaise;

    return {
      baseUnitPrice: baseUnitPricePaise / 100,
      baseUnitPricePaise,
      quantity,
      subtotal: subtotalPaise / 100,
      subtotalPaise,
      discountPercentage,
      discountAmount: discountAmountPaise / 100,
      discountAmountPaise,
      finalAmount: finalAmountPaise / 100,
      finalAmountPaise,
      currency: 'INR'
    };
  }

  /**
   * Explains the discount policy for UI display
   */
  public getDiscountTierDescription(cgpa?: number, isVerified?: boolean): string {
    if (!isVerified || !cgpa) {
      return 'Verify your institutional CGPA to unlock up to 20% merit discount on passes.';
    }

    const pct = this.calculateDiscountPercentage(cgpa, isVerified);
    if (pct === 20) {
      return `Outstanding CGPA (${cgpa.toFixed(2)}) qualifies for the Maximum 20% Academic Merit Discount.`;
    } else if (pct === 15) {
      return `High Honors CGPA (${cgpa.toFixed(2)}) qualifies for a 15% Academic Merit Discount.`;
    } else if (pct === 10) {
      return `Distinction CGPA (${cgpa.toFixed(2)}) qualifies for a 10% Academic Merit Discount.`;
    } else {
      return `Verified CGPA (${cgpa.toFixed(2)}) does not meet the minimum threshold (> 8.50) for merit discounts.`;
    }
  }
}

export const discountService = new DiscountService();
