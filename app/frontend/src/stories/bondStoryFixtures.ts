import type { BondCalculationResult, BondInput, CashFlowPeriod } from '../types';

export const sampleBondInput: BondInput = {
  faceValue: '1000',
  annualCouponRate: '6',
  marketPrice: '950',
  yearsToMaturity: '5',
  couponFrequency: 'semi-annual',
};

export const sampleCashFlowSchedule: CashFlowPeriod[] = Array.from({ length: 10 }, (_, index) => {
  const period = index + 1;
  const cumulativeInterest = 30 * period;

  return {
    period,
    paymentDate: `202${Math.floor(period / 2)}-${period % 2 === 0 ? '12' : '06'}-30`,
    couponPayment: '30.00',
    cumulativeInterest: cumulativeInterest.toFixed(2),
    remainingPrincipal: period === 10 ? '0.00' : '1000.00',
    isFinal: period === 10,
  };
});

export const sampleBondResult: BondCalculationResult = {
  currentYield: '0.0631578947',
  ytm: '0.0714271429',
  totalInterest: '300.00',
  premiumDiscount: {
    status: 'discount',
    difference: '50.00',
  },
  cashFlowSchedule: sampleCashFlowSchedule,
  input: sampleBondInput,
};
