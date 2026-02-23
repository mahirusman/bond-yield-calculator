import { BondInput, CashFlowPeriod, PremiumDiscount } from '../types/bond.types';

// ============================================================
// CONSTANTS
// ============================================================
const CONVERGENCE_TOLERANCE = 0.0001;
const MAX_ITERATIONS = 1000;

// ============================================================
// HELPER: Get coupon frequency as a number
// ============================================================
function getFrequencyNumber(input: BondInput): number {
  return input.couponFrequency === 'semi-annual' ? 2 : 1;
}

// ============================================================
// HELPER: Calculate coupon payment per period
// ============================================================
function getCouponPerPeriod(input: BondInput): number {
  const frequency = getFrequencyNumber(input);
  return (input.faceValue * (input.annualCouponRate / 100)) / frequency;
}

// ============================================================
// HELPER: Calculate total number of periods
// ============================================================
function getTotalPeriods(input: BondInput): number {
  const frequency = getFrequencyNumber(input);
  // Round to nearest whole period to handle fractional years
  return Math.round(input.yearsToMaturity * frequency);
}

// ============================================================
// HELPER: Calculate present value of bond at given yield rate
// Used by the YTM bisection solver
// ============================================================
function calculatePV(input: BondInput, annualYield: number): number {
  const frequency = getFrequencyNumber(input);
  const totalPeriods = getTotalPeriods(input);
  const couponPerPeriod = getCouponPerPeriod(input);
  const periodicRate = annualYield / frequency;

  let pv = 0;

  // Sum PV of all coupon payments
  for (let t = 1; t <= totalPeriods; t++) {
    pv += couponPerPeriod / Math.pow(1 + periodicRate, t);
  }

  // Add PV of face value at maturity
  pv += input.faceValue / Math.pow(1 + periodicRate, totalPeriods);

  return pv;
}

// ============================================================
// HELPER: Add months to a date (handles month-end edge cases)
// ============================================================
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetDay = result.getDate();
  result.setMonth(result.getMonth() + months);
  // Handle month-end overflow (e.g., Jan 31 -> Feb 28)
  if (result.getDate() !== targetDay) {
    result.setDate(0);
  }
  return result;
}

// ============================================================
// HELPER: Format date as YYYY-MM-DD
// ============================================================
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================
// HELPER: Round to 2 decimal places
// ============================================================
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ============================================================
// EXPORTED: Calculate Current Yield
// ============================================================
export function calculateCurrentYield(input: BondInput): number {
  if (input.annualCouponRate === 0) return 0;
  const annualCoupon = input.faceValue * (input.annualCouponRate / 100);
  return annualCoupon / input.marketPrice;
}

// ============================================================
// EXPORTED: Calculate YTM using Bisection Method
// ============================================================
export function calculateYTM(input: BondInput): number {
  // Zero-coupon bond shortcut
  if (input.annualCouponRate === 0) {
    return Math.pow(input.faceValue / input.marketPrice, 1 / input.yearsToMaturity) - 1;
  }

  // Par bond shortcut
  if (Math.abs(input.marketPrice - input.faceValue) < 0.01) {
    return input.annualCouponRate / 100;
  }

  let low = 0.0; // 0% annual yield
  let high = 1.0; // 100% annual yield
  let mid = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    mid = (low + high) / 2;
    const pvAtMid = calculatePV(input, mid);
    const diff = pvAtMid - input.marketPrice;

    if (Math.abs(diff) < CONVERGENCE_TOLERANCE) {
      return mid;
    }

    if (diff > 0) {
      // PV is too high -> yield is too low -> increase low
      low = mid;
    } else {
      // PV is too low -> yield is too high -> decrease high
      high = mid;
    }
  }

  // If we exit the loop without converging, throw an error
  throw new Error(
    'YTM calculation did not converge. Please verify your bond parameters are realistic.'
  );
}

// ============================================================
// EXPORTED: Calculate Total Interest Earned
// ============================================================
export function calculateTotalInterest(input: BondInput): number {
  const couponPerPeriod = getCouponPerPeriod(input);
  const totalPeriods = getTotalPeriods(input);
  return round2(couponPerPeriod * totalPeriods);
}

// ============================================================
// EXPORTED: Determine Premium or Discount
// ============================================================
export function determinePremiumDiscount(input: BondInput): PremiumDiscount {
  const diff = input.marketPrice - input.faceValue;
  const absDiff = round2(Math.abs(diff));

  if (diff > 0.005) {
    return { status: 'premium', difference: absDiff };
  }

  if (diff < -0.005) {
    return { status: 'discount', difference: absDiff };
  }

  return { status: 'par', difference: 0 };
}

// ============================================================
// EXPORTED: Generate Cash Flow Schedule
// ============================================================
export function generateCashFlowSchedule(input: BondInput): CashFlowPeriod[] {
  const frequency = getFrequencyNumber(input);
  const totalPeriods = getTotalPeriods(input);
  const couponPerPeriod = getCouponPerPeriod(input);
  const monthsPerPeriod = 12 / frequency; // 12 for annual, 6 for semi-annual
  const startDate = new Date();
  const schedule: CashFlowPeriod[] = [];

  let cumulativeInterest = 0;

  for (let t = 1; t <= totalPeriods; t++) {
    const paymentDate = addMonths(startDate, t * monthsPerPeriod);
    cumulativeInterest += couponPerPeriod;

    schedule.push({
      period: t,
      paymentDate: formatDate(paymentDate),
      couponPayment: round2(couponPerPeriod),
      cumulativeInterest: round2(cumulativeInterest),
      remainingPrincipal: round2(input.faceValue),
      isFinal: t === totalPeriods,
    });
  }

  return schedule;
}
