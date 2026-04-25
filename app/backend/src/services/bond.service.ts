import { BondCalculationResult, BondInput } from '@bond-calculator/shared';
import {
  calculateCurrentYield,
  calculateTotalInterest,
  calculateYTM,
  determinePremiumDiscount,
  generateCashFlowSchedule,
} from '@bond-calculator/shared';

export class BondService {
  calculate(input: BondInput): BondCalculationResult {
    const currentYield = calculateCurrentYield(input);
    const ytm = calculateYTM(input);
    const totalInterest = calculateTotalInterest(input);
    const cashFlowSchedule = generateCashFlowSchedule(input);
    const premiumDiscount = determinePremiumDiscount(input);

    return {
      currentYield,
      ytm,
      totalInterest,
      cashFlowSchedule,
      premiumDiscount,
      // Echo back the input for frontend convenience
      input,
    };
  }
}
