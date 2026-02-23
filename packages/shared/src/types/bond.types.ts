export type CouponFrequency = 'annual' | 'semi-annual';

export interface BondInput {
  faceValue: number;
  annualCouponRate: number; // percentage, e.g., 6 for 6%
  marketPrice: number;
  yearsToMaturity: number;
  couponFrequency: CouponFrequency;
}

export interface CashFlowPeriod {
  period: number;
  paymentDate: string; // ISO date string: YYYY-MM-DD
  couponPayment: number;
  cumulativeInterest: number;
  remainingPrincipal: number;
  isFinal: boolean;
}

export type PremiumDiscountStatus = 'premium' | 'discount' | 'par';

export interface PremiumDiscount {
  status: PremiumDiscountStatus;
  difference: number; // Math.abs(marketPrice - faceValue)
}

export interface BondCalculationResult {
  currentYield: number; // decimal, e.g., 0.06316
  ytm: number; // decimal, e.g., 0.07157
  totalInterest: number; // dollar amount
  premiumDiscount: PremiumDiscount;
  cashFlowSchedule: CashFlowPeriod[];
  input: BondInput; // echo back
}
