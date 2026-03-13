import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CashFlowPeriod } from '../types';
import { CashFlowTable } from '../components/CashFlowTable/CashFlowTable';

const schedule: CashFlowPeriod[] = [
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
    isFinal: false,
  },
  {
    period: 3,
    paymentDate: '2027-09-13',
    couponPayment: '30.00',
    cumulativeInterest: '90.00',
    remainingPrincipal: '1000.00',
    isFinal: true,
  },
];

describe('CashFlowTable', () => {
  // Validates the Period column header.
  it('renders the Period header', () => {
    render(<CashFlowTable schedule={schedule} />);

    expect(screen.getByRole('columnheader', { name: 'Period' })).toBeInTheDocument();
  });

  // Validates the Payment Date column header.
  it('renders the Payment Date header', () => {
    render(<CashFlowTable schedule={schedule} />);

    expect(screen.getByRole('columnheader', { name: 'Payment Date' })).toBeInTheDocument();
  });

  // Validates the Coupon Payment column header.
  it('renders the Coupon Payment header', () => {
    render(<CashFlowTable schedule={schedule} />);

    expect(screen.getByRole('columnheader', { name: 'Coupon Payment' })).toBeInTheDocument();
  });

  // Validates the Cumulative Interest column header.
  it('renders the Cumulative Interest header', () => {
    render(<CashFlowTable schedule={schedule} />);

    expect(screen.getByRole('columnheader', { name: 'Cumulative Interest' })).toBeInTheDocument();
  });

  // Validates the current principal column label used by the UI.
  it('renders the Principal Outstanding header', () => {
    render(<CashFlowTable schedule={schedule} />);

    expect(screen.getByRole('columnheader', { name: 'Principal Outstanding' })).toBeInTheDocument();
  });

  // Validates body row count against the provided schedule length.
  it('renders the correct number of rows', () => {
    render(<CashFlowTable schedule={schedule} />);

    const table = screen.getByRole('table', { name: /bond cash flow schedule/i });
    const rows = within(table).getAllByRole('row').slice(1);

    expect(rows).toHaveLength(schedule.length);
  });

  // Validates that the final row carries a distinct styling class.
  it('applies final-row styling to the last row', () => {
    const { container } = render(<CashFlowTable schedule={schedule} />);
    const lastRow = container.querySelector('tbody tr:last-child');

    expect(lastRow?.className).not.toBe('');
  });

  // Validates currency formatting on rendered values.
  it('shows currency values with two decimal places', () => {
    render(<CashFlowTable schedule={schedule} />);

    expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
  });

  // Validates that an empty schedule produces no body rows.
  it('renders no body rows for empty data', () => {
    const { container } = render(<CashFlowTable schedule={[]} />);

    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  // Validates sequential period display in the rendered rows.
  it('renders the period numbers', () => {
    render(<CashFlowTable schedule={schedule} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
