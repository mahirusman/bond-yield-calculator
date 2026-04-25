import { useCallback, useState } from 'react';
import { calculateBond } from '../api/bond.api';
import { BondCalculationResult, BondInput } from '../types';

interface UseBondCalculatorReturn {
  result: BondCalculationResult | null;
  loading: boolean;
  error: string | null;
  calculate: (input: BondInput) => Promise<void>;
}

export function useBondCalculator(): UseBondCalculatorReturn {
  const [result, setResult] = useState<BondCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: BondInput) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await calculateBond(input);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Calculation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, calculate };
}
