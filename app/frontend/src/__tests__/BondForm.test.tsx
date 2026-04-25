import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BondForm } from '../components/BondForm/BondForm';

describe('BondForm', () => {
  // Validates that the face value field is available to the user.
  it('renders the Face Value input', () => {
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.getByLabelText(/face value/i)).toBeInTheDocument();
  });

  // Validates that the annual coupon rate field is available to the user.
  it('renders the Annual Coupon Rate input', () => {
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.getByLabelText(/annual coupon rate/i)).toBeInTheDocument();
  });

  // Validates that the market price field is available to the user.
  it('renders the Market Price input', () => {
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.getByLabelText(/market price/i)).toBeInTheDocument();
  });

  // Validates that the maturity field is available to the user.
  it('renders the Years to Maturity input', () => {
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.getByLabelText(/years to maturity/i)).toBeInTheDocument();
  });

  // Validates that the frequency select is available to the user.
  it('renders the Coupon Frequency dropdown', () => {
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.getByLabelText(/coupon frequency/i)).toBeInTheDocument();
  });

  // Validates that the annual option is present.
  it('includes the annual option', () => {
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.getByRole('option', { name: /annual \(1× per year\)/i })).toBeInTheDocument();
  });

  // Validates that the semi-annual option is present.
  it('includes the semi-annual option', () => {
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    expect(
      screen.getByRole('option', { name: /semi-annual \(2× per year\)/i })
    ).toBeInTheDocument();
  });

  // Validates that the quarterly option is present.
  it('includes the quarterly option', () => {
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.getByRole('option', { name: /quarterly \(4× per year\)/i })).toBeInTheDocument();
  });

  // Validates that the submit action is available.
  it('renders the submit button', () => {
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    expect(screen.getByRole('button', { name: /calculate yield/i })).toBeInTheDocument();
  });

  // Validates that the face value input accepts user edits.
  it('allows the user to type into Face Value', async () => {
    const user = userEvent.setup();
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    const input = screen.getByLabelText(/face value/i);
    await user.clear(input);
    await user.type(input, '1250');

    expect(input).toHaveValue(1250);
  });

  // Validates that the market price input accepts user edits.
  it('allows the user to type into Market Price', async () => {
    const user = userEvent.setup();
    render(<BondForm onSubmit={vi.fn()} loading={false} />);

    const input = screen.getByLabelText(/market price/i);
    await user.clear(input);
    await user.type(input, '975');

    expect(input).toHaveValue(975);
  });

  // Validates that submit forwards the full form payload to the handler.
  it('submits the correct values to the handler', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<BondForm onSubmit={onSubmit} loading={false} />);

    await user.clear(screen.getByLabelText(/face value/i));
    await user.type(screen.getByLabelText(/face value/i), '1500');
    await user.clear(screen.getByLabelText(/annual coupon rate/i));
    await user.type(screen.getByLabelText(/annual coupon rate/i), '7.5');
    await user.clear(screen.getByLabelText(/market price/i));
    await user.type(screen.getByLabelText(/market price/i), '1475');
    await user.clear(screen.getByLabelText(/years to maturity/i));
    await user.type(screen.getByLabelText(/years to maturity/i), '8');
    await user.selectOptions(screen.getByLabelText(/coupon frequency/i), 'quarterly');
    await user.click(screen.getByRole('button', { name: /calculate yield/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          faceValue: '1500',
          annualCouponRate: '7.5',
          marketPrice: '1475',
          yearsToMaturity: '8',
          couponFrequency: 'quarterly',
        },
        expect.anything()
      );
    });
  });

  // Validates that the form blocks duplicate submissions while loading.
  it('disables the button while loading', () => {
    render(<BondForm onSubmit={vi.fn()} loading />);

    expect(screen.getByRole('button', { name: /calculating/i })).toBeDisabled();
  });
});
