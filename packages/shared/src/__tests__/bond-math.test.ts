import { BondInput } from '../types/bond.types';
import {
  calculateCurrentYield,
  calculateYTM,
  determinePremiumDiscount,
  generateCashFlowSchedule,
} from '../utils/bond-math';

const baseInput: BondInput = {
  faceValue: 1000,
  annualCouponRate: 6,
  marketPrice: 950,
  yearsToMaturity: 5,
  couponFrequency: 'semi-annual',
};

describe('calculateCurrentYield', () => {
  it('should calculate current yield correctly for a discount bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: 950 };
    const result = calculateCurrentYield(input);

    expect(result).toBeCloseTo(0.0631578947, 6);
  });

  it('should calculate current yield for a premium bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: 1050 };
    const result = calculateCurrentYield(input);

    expect(result).toBeCloseTo(0.0571428571, 6);
  });

  it('should return 0 for zero-coupon bond', () => {
    const input: BondInput = { ...baseInput, annualCouponRate: 0, marketPrice: 620 };
    const result = calculateCurrentYield(input);

    expect(result).toBe(0);
  });
});

describe('calculateYTM', () => {
  it('should equal coupon rate when bond is priced at par', () => {
    const input: BondInput = { ...baseInput, marketPrice: 1000, couponFrequency: 'annual' };
    const result = calculateYTM(input);

    expect(result).toBeCloseTo(0.06, 4);
  });

  it('should be higher than coupon rate for discount bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: 950, couponFrequency: 'annual' };
    const result = calculateYTM(input);

    expect(result).toBeGreaterThan(0.06);
  });

  it('should be lower than coupon rate for premium bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: 1050, couponFrequency: 'annual' };
    const result = calculateYTM(input);

    expect(result).toBeLessThan(0.06);
  });

  it('should handle semi-annual coupon frequency', () => {
    const annualInput: BondInput = { ...baseInput, couponFrequency: 'annual' };
    const semiAnnualInput: BondInput = { ...baseInput, couponFrequency: 'semi-annual' };

    const annualYtm = calculateYTM(annualInput);
    const semiAnnualYtm = calculateYTM(semiAnnualInput);

    expect(semiAnnualYtm).not.toBeCloseTo(annualYtm, 6);
  });

  it('should handle zero-coupon bond', () => {
    const input: BondInput = {
      faceValue: 1000,
      annualCouponRate: 0,
      marketPrice: 620,
      yearsToMaturity: 5,
      couponFrequency: 'annual',
    };
    const expected = Math.pow(1000 / 620, 1 / 5) - 1;
    const result = calculateYTM(input);

    expect(result).toBeCloseTo(expected, 4);
  });
});

describe('generateCashFlowSchedule', () => {
  it('should generate correct number of periods for annual bond', () => {
    const input: BondInput = { ...baseInput, couponFrequency: 'annual', yearsToMaturity: 5 };
    const schedule = generateCashFlowSchedule(input);

    expect(schedule).toHaveLength(5);
  });

  it('should generate correct number of periods for semi-annual bond', () => {
    const input: BondInput = { ...baseInput, couponFrequency: 'semi-annual', yearsToMaturity: 5 };
    const schedule = generateCashFlowSchedule(input);

    expect(schedule).toHaveLength(10);
  });

  it('should correctly mark the last period as isFinal: true', () => {
    const input: BondInput = { ...baseInput, couponFrequency: 'semi-annual', yearsToMaturity: 5 };
    const schedule = generateCashFlowSchedule(input);

    expect(schedule[schedule.length - 1]?.isFinal).toBe(true);
    expect(schedule[0]?.isFinal).toBe(false);
  });

  it('should calculate cumulative interest correctly', () => {
    const input: BondInput = { ...baseInput, couponFrequency: 'annual', yearsToMaturity: 3 };
    const schedule = generateCashFlowSchedule(input);

    expect(schedule[0]?.cumulativeInterest).toBeCloseTo(60, 2);
    expect(schedule[1]?.cumulativeInterest).toBeCloseTo(120, 2);
    expect(schedule[2]?.cumulativeInterest).toBeCloseTo(180, 2);
  });

  it('should keep remainingPrincipal equal to faceValue throughout', () => {
    const input: BondInput = { ...baseInput, couponFrequency: 'semi-annual', yearsToMaturity: 2 };
    const schedule = generateCashFlowSchedule(input);

    expect(schedule.every((row) => row.remainingPrincipal === input.faceValue)).toBe(true);
  });
});

describe('determinePremiumDiscount', () => {
  it('should return "premium" when market price > face value', () => {
    const input: BondInput = { ...baseInput, marketPrice: 1050 };
    expect(determinePremiumDiscount(input)).toEqual({ status: 'premium', difference: 50 });
  });

  it('should return "discount" when market price < face value', () => {
    const input: BondInput = { ...baseInput, marketPrice: 950 };
    expect(determinePremiumDiscount(input)).toEqual({ status: 'discount', difference: 50 });
  });

  it('should return "par" when market price === face value', () => {
    const input: BondInput = { ...baseInput, marketPrice: 1000 };
    expect(determinePremiumDiscount(input)).toEqual({ status: 'par', difference: 0 });
  });
});
