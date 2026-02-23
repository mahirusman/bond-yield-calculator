import { BondInput } from '../types/bond.types';
import { calculateCurrentYield } from '../utils/bond-math';

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
