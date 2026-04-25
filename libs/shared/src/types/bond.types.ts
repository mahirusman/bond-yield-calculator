export type CouponFrequency = 'annual' | 'semi-annual' | 'quarterly';
export type DecimalValue = string;

export interface BondInput {
  faceValue: DecimalValue;
  annualCouponRate: DecimalValue; // percentage, e.g., 6 for 6%
  marketPrice: DecimalValue;
  yearsToMaturity: DecimalValue;
  couponFrequency: CouponFrequency;
}

export interface CashFlowPeriod {
  period: number;
  paymentDate: string; // ISO date string: YYYY-MM-DD
  couponPayment: DecimalValue;
  cumulativeInterest: DecimalValue;
  remainingPrincipal: DecimalValue;
  isFinal: boolean;
}

export type PremiumDiscountStatus = 'premium' | 'discount' | 'par';

export interface PremiumDiscount {
  status: PremiumDiscountStatus;
  difference: DecimalValue; // Math.abs(marketPrice - faceValue)
}

export interface BondCalculationResult {
  currentYield: DecimalValue; // decimal ratio, e.g., 0.06316
  ytm: DecimalValue; // decimal ratio, e.g., 0.07157
  totalInterest: DecimalValue; // dollar amount
  premiumDiscount: PremiumDiscount;
  cashFlowSchedule: CashFlowPeriod[];
  input: BondInput; // echo back
}
