import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BondCalculationResult } from '../types';
import { ResultsPanel } from '../components/ResultsPanel/ResultsPanel';

const baseResult: BondCalculationResult = {
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
    {
      period: 2,
      paymentDate: '2027-03-13',
      couponPayment: '30.00',
      cumulativeInterest: '60.00',
      remainingPrincipal: '1000.00',
      isFinal: true,
    },
  ],
  input: {
    faceValue: '1000',
    annualCouponRate: '6',
    marketPrice: '950',
    yearsToMaturity: '1',
    couponFrequency: 'semi-annual',
  },
};

describe('ResultsPanel', () => {
  // Validates the null-guard path used before any calculation has been run.
  it('renders nothing when result is null', () => {
    const { container } = render(<ResultsPanel result={null} />);

    expect(container.firstChild).toBeNull();
  });

  // Validates the Current Yield metric label.
  it('renders the Current Yield metric', () => {
    render(<ResultsPanel result={baseResult} />);

    expect(screen.getByText('Current Yield')).toBeInTheDocument();
  });

  // Validates the YTM metric label.
  it('renders the YTM metric', () => {
    render(<ResultsPanel result={baseResult} />);

    expect(screen.getByText('Yield to Maturity (YTM)')).toBeInTheDocument();
  });

  // Validates the Total Interest metric label.
  it('renders the Total Interest metric', () => {
    render(<ResultsPanel result={baseResult} />);

    expect(screen.getByText('Total Interest Earned')).toBeInTheDocument();
  });

  // Validates premium/discount status rendering.
  it('renders the premium or discount status', () => {
    render(<ResultsPanel result={baseResult} />);

    expect(screen.getByText('Discount')).toBeInTheDocument();
  });

  // Validates that the cash flow table is embedded in the results.
  it('renders the cash flow table', () => {
    render(<ResultsPanel result={baseResult} />);

    expect(screen.getByRole('table', { name: /bond cash flow schedule/i })).toBeInTheDocument();
  });

  // Validates premium-label rendering.
  it('shows premium text for a premium bond', () => {
    render(
      <ResultsPanel
        result={{
          ...baseResult,
          premiumDiscount: { status: 'premium', difference: '25.00' },
        }}
      />
    );

    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  // Validates discount-label rendering.
  it('shows discount text for a discount bond', () => {
    render(<ResultsPanel result={baseResult} />);

    expect(screen.getByText('Discount')).toBeInTheDocument();
  });

  // Validates par-label rendering.
  it('shows par text for a par bond', () => {
    render(
      <ResultsPanel
        result={{
          ...baseResult,
          premiumDiscount: { status: 'par', difference: '0.00' },
        }}
      />
    );

    expect(screen.getByText('Par')).toBeInTheDocument();
  });
});
