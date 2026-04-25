import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricCard } from '../components/MetricCard/MetricCard';

describe('MetricCard', () => {
  // Validates that the metric label is rendered for screen consumption.
  it('renders the title prop', () => {
    render(
      <MetricCard
        title="Current Yield"
        value="6.3158%"
        description="Annual coupon ÷ market price"
      />
    );

    expect(screen.getByText('Current Yield')).toBeInTheDocument();
  });

  // Validates that the metric value is rendered prominently.
  it('renders the value prop', () => {
    render(
      <MetricCard
        title="Current Yield"
        value="6.3158%"
        description="Annual coupon ÷ market price"
      />
    );

    expect(screen.getByText('6.3158%')).toBeInTheDocument();
  });

  // Validates the optional supporting description text.
  it('renders the description when provided', () => {
    render(
      <MetricCard
        title="Current Yield"
        value="6.3158%"
        description="Annual coupon ÷ market price"
      />
    );

    expect(screen.getByText('Annual coupon ÷ market price')).toBeInTheDocument();
  });

  // Validates the rendered structure through a snapshot baseline.
  it('matches the snapshot', () => {
    const { container } = render(
      <MetricCard
        title="Current Yield"
        value="6.3158%"
        description="Annual coupon ÷ market price"
      />
    );
    const root = container.firstElementChild as HTMLElement;

    root.removeAttribute('class');
    root.querySelectorAll('*').forEach((node) => node.removeAttribute('class'));

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div>
        <p>
          Current Yield
        </p>
        <p>
          6.3158%
        </p>
        <p>
          Annual coupon ÷ market price
        </p>
      </div>
    `);
  });
});
