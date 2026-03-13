import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateBond } from '../api/bond.api';
import { useBondCalculator } from '../hooks/useBondCalculator';
import { BondCalculationResult, BondInput } from '../types';

vi.mock('../api/bond.api', () => ({
  calculateBond: vi.fn(),
}));

const mockedCalculateBond = vi.mocked(calculateBond);

const input: BondInput = {
  faceValue: '1000',
  annualCouponRate: '6',
  marketPrice: '950',
  yearsToMaturity: '5',
  couponFrequency: 'semi-annual',
};

const mockResult: BondCalculationResult = {
  currentYield: '0.0631578947',
  ytm: '0.0720874776',
  totalInterest: '300.00',
  premiumDiscount: {
    status: 'discount',
    difference: '50.00',
  },
  cashFlowSchedule: [
    {
      period: 1,
      paymentDate: '2026-09-13',
      couponPayment: '30.00',
      cumulativeInterest: '30.00',
      remainingPrincipal: '1000.00',
      isFinal: false,
    },
  ],
  input,
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('useBondCalculator', () => {
  beforeEach(() => {
    mockedCalculateBond.mockReset();
  });

  // Validates the initial absence of calculation results.
  it('starts with a null result', () => {
    const { result } = renderHook(() => useBondCalculator());

    expect(result.current.result).toBeNull();
  });

  // Validates the initial loading flag.
  it('starts with loading set to false', () => {
    const { result } = renderHook(() => useBondCalculator());

    expect(result.current.loading).toBe(false);
  });

  // Validates the initial error state.
  it('starts with a null error', () => {
    const { result } = renderHook(() => useBondCalculator());

    expect(result.current.error).toBeNull();
  });

  // Validates that loading flips immediately when a calculation begins.
  it('sets loading to true while a request is in flight', async () => {
    const deferred = createDeferred<BondCalculationResult>();
    mockedCalculateBond.mockReturnValueOnce(deferred.promise);
    const { result } = renderHook(() => useBondCalculator());

    act(() => {
      void result.current.calculate(input);
    });

    expect(result.current.loading).toBe(true);

    deferred.resolve(mockResult);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  // Validates successful result hydration.
  it('stores results after a successful response', async () => {
    mockedCalculateBond.mockResolvedValueOnce(mockResult);
    const { result } = renderHook(() => useBondCalculator());

    await act(async () => {
      await result.current.calculate(input);
    });

    expect(result.current.result).toEqual(mockResult);
  });

  // Validates that a successful response clears prior errors.
  it('clears error state after a successful response', async () => {
    mockedCalculateBond
      .mockRejectedValueOnce(new Error('Validation failed'))
      .mockResolvedValueOnce(mockResult);
    const { result } = renderHook(() => useBondCalculator());

    await act(async () => {
      await result.current.calculate(input);
    });
    await act(async () => {
      await result.current.calculate(input);
    });

    expect(result.current.error).toBeNull();
  });

  // Validates loading reset on success.
  it('sets loading to false after a successful response', async () => {
    mockedCalculateBond.mockResolvedValueOnce(mockResult);
    const { result } = renderHook(() => useBondCalculator());

    await act(async () => {
      await result.current.calculate(input);
    });

    expect(result.current.loading).toBe(false);
  });

  // Validates validation-message propagation from API failures.
  it('stores the validation error message when the API rejects with a 400-like error', async () => {
    mockedCalculateBond.mockRejectedValueOnce(new Error('Face value must be a positive number'));
    const { result } = renderHook(() => useBondCalculator());

    await act(async () => {
      await result.current.calculate(input);
    });

    expect(result.current.error).toContain('Face value must be a positive number');
  });

  // Validates that failed requests clear stale successful results.
  it('clears existing results after an error', async () => {
    mockedCalculateBond
      .mockResolvedValueOnce(mockResult)
      .mockRejectedValueOnce(new Error('Network error. Please check your connection.'));
    const { result } = renderHook(() => useBondCalculator());

    await act(async () => {
      await result.current.calculate(input);
    });
    await act(async () => {
      await result.current.calculate(input);
    });

    expect(result.current.result).toBeNull();
  });

  // Validates generic network-error handling.
  it('stores the network error message when the request fails', async () => {
    mockedCalculateBond.mockRejectedValueOnce(new Error('Network error. Please check your connection.'));
    const { result } = renderHook(() => useBondCalculator());

    await act(async () => {
      await result.current.calculate(input);
    });

    expect(result.current.error).toBeTruthy();
  });

  // Validates loading reset after errors.
  it('sets loading to false after an error', async () => {
    mockedCalculateBond.mockRejectedValueOnce(new Error('Network error. Please check your connection.'));
    const { result } = renderHook(() => useBondCalculator());

    await act(async () => {
      await result.current.calculate(input);
    });

    expect(result.current.loading).toBe(false);
  });
});
