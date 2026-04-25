import { BondInput, CashFlowPeriod, PremiumDiscount } from '../types/bond.types';
import { Decimal, parseDecimal, roundMoney, roundYield } from './decimal';

const MAX_ITERATIONS = 1000;
const PRICE_CONVERGENCE_TOLERANCE = new Decimal('0.0000000001');
const YIELD_CONVERGENCE_TOLERANCE = new Decimal('0.000000000001');

interface ParsedBondInput {
  faceValue: Decimal;
  annualCouponRate: Decimal;
  marketPrice: Decimal;
  yearsToMaturity: Decimal;
  couponFrequency: BondInput['couponFrequency'];
}

function parseBondInput(input: BondInput): ParsedBondInput {
  return {
    faceValue: parseDecimal(input.faceValue),
    annualCouponRate: parseDecimal(input.annualCouponRate),
    marketPrice: parseDecimal(input.marketPrice),
    yearsToMaturity: parseDecimal(input.yearsToMaturity),
    couponFrequency: input.couponFrequency,
  };
}

function getFrequencyNumber(input: ParsedBondInput): number {
  if (input.couponFrequency === 'semi-annual') {
    return 2;
  }

  if (input.couponFrequency === 'quarterly') {
    return 4;
  }

  return 1;
}

function getCouponPerPeriod(input: ParsedBondInput): Decimal {
  return input.faceValue.mul(input.annualCouponRate.div(100)).div(getFrequencyNumber(input));
}

function getTotalPeriods(input: ParsedBondInput): number {
  const frequency = getFrequencyNumber(input);
  return input.yearsToMaturity.mul(frequency).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

function calculatePV(input: ParsedBondInput, annualYield: Decimal): Decimal {
  const frequency = getFrequencyNumber(input);
  const totalPeriods = getTotalPeriods(input);
  const couponPerPeriod = getCouponPerPeriod(input);
  const periodicRate = annualYield.div(frequency);

  let pv = new Decimal(0);

  for (let t = 1; t <= totalPeriods; t++) {
    pv = pv.add(couponPerPeriod.div(periodicRate.add(1).pow(t)));
  }

  return pv.add(input.faceValue.div(periodicRate.add(1).pow(totalPeriods)));
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetDay = result.getDate();
  result.setMonth(result.getMonth() + months);

  if (result.getDate() !== targetDay) {
    result.setDate(0);
  }

  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function findYieldBounds(input: ParsedBondInput): { low: Decimal; high: Decimal } {
  const low = new Decimal('-0.99');
  let high = new Decimal('1');
  const marketPrice = input.marketPrice;

  const diffAtLow = calculatePV(input, low).minus(marketPrice);
  if (diffAtLow.lt(0)) {
    throw new Error('Unable to bracket YTM with the provided bond parameters.');
  }

  let diffAtHigh = calculatePV(input, high).minus(marketPrice);
  let expansions = 0;

  while (diffAtHigh.gt(0) && expansions < 20) {
    high = high.mul(2);
    diffAtHigh = calculatePV(input, high).minus(marketPrice);
    expansions += 1;
  }

  if (diffAtHigh.gt(0)) {
    throw new Error(
      'YTM calculation did not converge. Please verify your bond parameters are realistic.'
    );
  }

  return { low, high };
}

export function calculateCurrentYield(input: BondInput): string {
  const parsed = parseBondInput(input);

  if (parsed.annualCouponRate.eq(0)) {
    return roundYield(new Decimal(0));
  }

  const annualCoupon = parsed.faceValue.mul(parsed.annualCouponRate.div(100));
  return roundYield(annualCoupon.div(parsed.marketPrice));
}

export function calculateYTM(input: BondInput): string {
  const parsed = parseBondInput(input);

  if (parsed.marketPrice.eq(parsed.faceValue)) {
    return roundYield(parsed.annualCouponRate.div(100));
  }

  const { low: initialLow, high: initialHigh } = findYieldBounds(parsed);
  let low = initialLow;
  let high = initialHigh;
  let mid = new Decimal(0);

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    mid = low.add(high).div(2);
    const diff = calculatePV(parsed, mid).minus(parsed.marketPrice);

    if (
      diff.abs().lte(PRICE_CONVERGENCE_TOLERANCE) ||
      high.minus(low).abs().lte(YIELD_CONVERGENCE_TOLERANCE)
    ) {
      return roundYield(mid);
    }

    if (diff.gt(0)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  throw new Error(
    'YTM calculation did not converge. Please verify your bond parameters are realistic.'
  );
}

export function calculateTotalInterest(input: BondInput): string {
  const parsed = parseBondInput(input);
  return roundMoney(getCouponPerPeriod(parsed).mul(getTotalPeriods(parsed)));
}

export function determinePremiumDiscount(input: BondInput): PremiumDiscount {
  const parsed = parseBondInput(input);
  const diff = parsed.marketPrice.minus(parsed.faceValue);

  if (diff.gt(0)) {
    return { status: 'premium', difference: roundMoney(diff.abs()) };
  }

  if (diff.lt(0)) {
    return { status: 'discount', difference: roundMoney(diff.abs()) };
  }

  return { status: 'par', difference: '0.00' };
}

export function generateCashFlowSchedule(input: BondInput): CashFlowPeriod[] {
  const parsed = parseBondInput(input);
  const frequency = getFrequencyNumber(parsed);
  const totalPeriods = getTotalPeriods(parsed);
  const couponPerPeriod = getCouponPerPeriod(parsed);
  const monthsPerPeriod = 12 / frequency;
  const startDate = new Date();
  const schedule: CashFlowPeriod[] = [];

  let cumulativeInterest = new Decimal(0);

  for (let t = 1; t <= totalPeriods; t++) {
    cumulativeInterest = cumulativeInterest.add(couponPerPeriod);

    schedule.push({
      period: t,
      paymentDate: formatDate(addMonths(startDate, t * monthsPerPeriod)),
      couponPayment: roundMoney(couponPerPeriod),
      cumulativeInterest: roundMoney(cumulativeInterest),
      remainingPrincipal: roundMoney(parsed.faceValue),
      isFinal: t === totalPeriods,
    });
  }

  return schedule;
}
