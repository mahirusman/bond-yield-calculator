import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BondInput } from '../types/bond.types';
import { Decimal } from '../utils/decimal';
import {
  calculateCurrentYield,
  calculateTotalInterest,
  calculateYTM,
  determinePremiumDiscount,
  generateCashFlowSchedule,
} from '../utils/bond-math';

const baseInput: BondInput = {
  faceValue: '1000',
  annualCouponRate: '6',
  marketPrice: '950',
  yearsToMaturity: '5',
  couponFrequency: 'semi-annual',
};

describe('calculateCurrentYield', () => {
  // Validates the standard discount-bond formula against the canonical project example.
  it('returns the current yield for a standard discount bond', () => {
    expect(Number(calculateCurrentYield(baseInput))).toBeCloseTo(0.0631578947, 6);
  });

  // Validates the par case where current yield should equal the coupon rate.
  it('returns the coupon rate for a par bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: '1000', couponFrequency: 'annual' };

    expect(Number(calculateCurrentYield(input))).toBeCloseTo(0.06, 6);
  });

  // Validates that premium pricing pushes current yield below the coupon rate.
  it('returns a value below the coupon rate for a premium bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: '1100', couponFrequency: 'annual' };

    expect(Number(calculateCurrentYield(input))).toBeLessThan(0.06);
  });

  // Validates that discount pricing pushes current yield above the coupon rate.
  it('returns a value above the coupon rate for a discount bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: '900', couponFrequency: 'annual' };

    expect(Number(calculateCurrentYield(input))).toBeGreaterThan(0.06);
  });

  // Validates a higher coupon scenario for boundary sanity.
  it('handles a high coupon rate correctly', () => {
    const input: BondInput = {
      ...baseInput,
      annualCouponRate: '10',
      marketPrice: '1000',
      couponFrequency: 'annual',
    };

    expect(Number(calculateCurrentYield(input))).toBeCloseTo(0.1, 6);
  });

  // Validates behavior when the market price is unusually low.
  it('handles a very low market price', () => {
    const input: BondInput = {
      ...baseInput,
      marketPrice: '100',
      couponFrequency: 'annual',
    };

    expect(Number(calculateCurrentYield(input))).toBeCloseTo(0.6, 6);
  });

  // Validates the zero-coupon case where annual coupon income is zero.
  it('returns zero for a zero-coupon bond', () => {
    const input: BondInput = {
      ...baseInput,
      annualCouponRate: '0',
      marketPrice: '620',
      couponFrequency: 'annual',
    };

    expect(calculateCurrentYield(input)).toBe('0.0000000000');
  });

  // Documents the current implementation behavior when dividing by a zero price.
  it('returns Infinity when the market price is zero', () => {
    const input: BondInput = {
      ...baseInput,
      marketPrice: '0',
      couponFrequency: 'annual',
    };

    expect(calculateCurrentYield(input)).toBe('Infinity');
  });
});

describe('calculateYTM', () => {
  // Validates the expected semi-annual YTM for the canonical discount-bond sample.
  it('returns the expected YTM for a semi-annual discount bond', () => {
    expect(Number(calculateYTM(baseInput))).toBeCloseTo(0.0720874776, 6);
  });

  // Validates that a par bond annualizes exactly to the coupon rate.
  it('returns the coupon rate for an at-par bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: '1000', couponFrequency: 'annual' };

    expect(Number(calculateYTM(input))).toBeCloseTo(0.06, 6);
  });

  // Validates that premium pricing implies a lower yield than the coupon rate.
  it('returns a value below the coupon rate for a premium bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: '1050', couponFrequency: 'annual' };

    expect(new Decimal(calculateYTM(input)).lt(new Decimal('0.06'))).toBe(true);
  });

  // Validates that discount pricing implies a higher yield than the coupon rate.
  it('returns a value above the coupon rate for a discount bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: '950', couponFrequency: 'annual' };

    expect(new Decimal(calculateYTM(input)).gt(new Decimal('0.06'))).toBe(true);
  });

  // Validates the annual-frequency branch of the solver.
  it('returns a valid value for annual frequency', () => {
    const input: BondInput = { ...baseInput, couponFrequency: 'annual', yearsToMaturity: '5' };

    expect(new Decimal(calculateYTM(input)).isFinite()).toBe(true);
  });

  // Validates the quarterly-frequency branch after extending the supported frequency set.
  it('returns a valid value for quarterly frequency', () => {
    const input: BondInput = { ...baseInput, couponFrequency: 'quarterly', yearsToMaturity: '5' };

    expect(new Decimal(calculateYTM(input)).isFinite()).toBe(true);
  });

  // Validates the short-duration edge case with only one remaining period.
  it('returns a valid value when one period remains', () => {
    const input: BondInput = {
      ...baseInput,
      couponFrequency: 'annual',
      yearsToMaturity: '1',
      marketPrice: '990',
    };

    expect(new Decimal(calculateYTM(input)).isFinite()).toBe(true);
  });

  // Validates positive yield behavior for a pure discount zero-coupon bond.
  it('returns a positive value for a zero-coupon bond', () => {
    const input: BondInput = {
      faceValue: '1000',
      annualCouponRate: '0',
      marketPrice: '600',
      yearsToMaturity: '10',
      couponFrequency: 'annual',
    };

    expect(new Decimal(calculateYTM(input)).gt(0)).toBe(true);
  });

  // Validates solver stability for a long-duration bond.
  it('returns a valid value for a 30-year bond', () => {
    const input: BondInput = {
      ...baseInput,
      yearsToMaturity: '30',
      couponFrequency: 'semi-annual',
      marketPrice: '975',
    };

    expect(new Decimal(calculateYTM(input)).isFinite()).toBe(true);
  });
});

describe('calculateTotalInterest', () => {
  // Validates the baseline total-interest calculation for a 5-year bond.
  it('returns the expected value for a standard 5-year bond', () => {
    expect(calculateTotalInterest(baseInput)).toBe('300.00');
  });

  // Validates the single-year boundary case.
  it('returns the expected value for a 1-year bond', () => {
    const input: BondInput = { ...baseInput, yearsToMaturity: '1', couponFrequency: 'annual' };

    expect(calculateTotalInterest(input)).toBe('60.00');
  });

  // Validates long-duration accumulation.
  it('returns the expected value for a 30-year bond', () => {
    const input: BondInput = { ...baseInput, yearsToMaturity: '30', couponFrequency: 'annual' };

    expect(calculateTotalInterest(input)).toBe('1800.00');
  });

  // Validates zero-coupon behavior.
  it('returns zero for a zero-coupon bond', () => {
    const input: BondInput = {
      ...baseInput,
      annualCouponRate: '0',
      yearsToMaturity: '5',
      couponFrequency: 'annual',
    };

    expect(calculateTotalInterest(input)).toBe('0.00');
  });

  // Validates high coupon accumulation.
  it('returns the expected value for a high coupon bond', () => {
    const input: BondInput = {
      ...baseInput,
      annualCouponRate: '10',
      yearsToMaturity: '10',
      couponFrequency: 'annual',
    };

    expect(calculateTotalInterest(input)).toBe('1000.00');
  });

  // Validates the money-format contract used across the API.
  it('always returns a money string with two decimal places', () => {
    expect(calculateTotalInterest(baseInput)).toMatch(/^\d+\.\d{2}$/);
  });
});

describe('determinePremiumDiscount', () => {
  // Validates discount classification and difference formatting.
  it('returns discount status for a discount bond', () => {
    expect(determinePremiumDiscount(baseInput)).toEqual({
      status: 'discount',
      difference: '50.00',
    });
  });

  // Validates premium classification and difference formatting.
  it('returns premium status for a premium bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: '1100' };

    expect(determinePremiumDiscount(input)).toEqual({
      status: 'premium',
      difference: '100.00',
    });
  });

  // Validates par classification.
  it('returns par status for a par bond', () => {
    const input: BondInput = { ...baseInput, marketPrice: '1000' };

    expect(determinePremiumDiscount(input)).toEqual({
      status: 'par',
      difference: '0.00',
    });
  });

  // Validates larger premium differences.
  it('returns the expected difference for a large premium', () => {
    const input: BondInput = { ...baseInput, marketPrice: '1500' };

    expect(determinePremiumDiscount(input)).toEqual({
      status: 'premium',
      difference: '500.00',
    });
  });

  // Validates sub-dollar precision in the difference formatter.
  it('returns the expected difference for a tiny premium', () => {
    const input: BondInput = { ...baseInput, marketPrice: '1000.01' };

    expect(determinePremiumDiscount(input)).toEqual({
      status: 'premium',
      difference: '0.01',
    });
  });

  // Validates that the difference field is always returned as a positive amount.
  it('always returns a positive difference amount', () => {
    const input: BondInput = { ...baseInput, marketPrice: '900' };

    expect(new Decimal(determinePremiumDiscount(input).difference).gte(0)).toBe(true);
  });
});

describe('generateCashFlowSchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-13T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Validates that a 5-year semi-annual bond produces 10 coupon periods.
  it('returns 10 periods for a 5-year semi-annual bond', () => {
    expect(generateCashFlowSchedule(baseInput)).toHaveLength(10);
  });

  // Validates that annual frequency maps directly to one period per year.
  it('returns 3 periods for a 3-year annual bond', () => {
    const input: BondInput = { ...baseInput, couponFrequency: 'annual', yearsToMaturity: '3' };

    expect(generateCashFlowSchedule(input)).toHaveLength(3);
  });

  // Validates that quarterly frequency maps to four periods per year.
  it('returns 8 periods for a 2-year quarterly bond', () => {
    const input: BondInput = { ...baseInput, couponFrequency: 'quarterly', yearsToMaturity: '2' };

    expect(generateCashFlowSchedule(input)).toHaveLength(8);
  });

  // Validates maturity flagging for the final payment row.
  it('marks the last period as final', () => {
    const schedule = generateCashFlowSchedule(baseInput);

    expect(schedule[schedule.length - 1]?.isFinal).toBe(true);
  });

  // Validates that non-final rows do not carry the maturity marker.
  it('marks all non-final periods as not final', () => {
    const schedule = generateCashFlowSchedule(baseInput);

    expect(schedule.slice(0, -1).every((row) => row.isFinal === false)).toBe(true);
  });

  // Validates per-period coupon allocation from the annual coupon.
  it('calculates coupon payment per period correctly', () => {
    const schedule = generateCashFlowSchedule(baseInput);

    expect(schedule[0]?.couponPayment).toBe('30.00');
  });

  // Validates the monotonic growth of cumulative interest.
  it('increases cumulative interest every period', () => {
    const schedule = generateCashFlowSchedule(baseInput);

    expect(
      schedule.slice(1).every((row, index) => {
        const previous = new Decimal(schedule[index]?.cumulativeInterest ?? '0');
        return new Decimal(row.cumulativeInterest).gt(previous);
      })
    ).toBe(true);
  });

  // Validates the non-amortizing bond assumption for principal outstanding.
  it('keeps remaining principal equal to face value before maturity', () => {
    const schedule = generateCashFlowSchedule(baseInput);

    expect(schedule.slice(0, -1).every((row) => row.remainingPrincipal === '1000.00')).toBe(true);
  });

  // Validates month-spacing behavior for semi-annual schedules.
  it('spaces semi-annual payment dates by six months', () => {
    const schedule = generateCashFlowSchedule(baseInput);

    expect(schedule[0]?.paymentDate).toBe('2026-09-13');
    expect(schedule[1]?.paymentDate).toBe('2027-03-13');
  });

  // Validates that period numbering is sequential and one-based.
  it('numbers periods sequentially from one', () => {
    const schedule = generateCashFlowSchedule(baseInput);

    expect(schedule.every((row, index) => row.period === index + 1)).toBe(true);
  });

  // Validates the basic return type contract for downstream consumers.
  it('returns an array', () => {
    expect(Array.isArray(generateCashFlowSchedule(baseInput))).toBe(true);
  });
});
