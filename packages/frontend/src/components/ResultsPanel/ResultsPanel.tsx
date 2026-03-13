import React from 'react';
import { BondCalculationResult } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/decimal';
import { CashFlowTable } from '../CashFlowTable/CashFlowTable';
import { MetricCard } from '../MetricCard/MetricCard';
import styles from './ResultsPanel.module.css';

interface ResultsPanelProps {
  result: BondCalculationResult | null;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  if (!result) {
    return null;
  }

  const { currentYield, ytm, totalInterest, premiumDiscount } = result;

  const premiumDiscountColor =
    premiumDiscount.status === 'premium'
      ? '#16a34a'
      : premiumDiscount.status === 'discount'
        ? '#dc2626'
        : '#2563eb';

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Results</h2>

      <div className={styles.metricsGrid}>
        <MetricCard
          title="Current Yield"
          value={formatPercent(currentYield)}
          description="Annual coupon ÷ market price"
        />
        <MetricCard
          title="Yield to Maturity (YTM)"
          value={formatPercent(ytm)}
          description="Total annualized return if held to maturity"
        />
        <MetricCard
          title="Total Interest Earned"
          value={formatCurrency(totalInterest)}
          description="Sum of all coupon payments over bond life"
        />
        <MetricCard
          title={premiumDiscount.status.charAt(0).toUpperCase() + premiumDiscount.status.slice(1)}
          value={formatCurrency(premiumDiscount.difference)}
          description={
            premiumDiscount.status === 'premium'
              ? 'Bond trades above face value'
              : premiumDiscount.status === 'discount'
                ? 'Bond trades below face value'
                : 'Bond trades at face value'
          }
          accentColor={premiumDiscountColor}
        />
      </div>

      <div className={styles.tableSection}>
        <h3>Cash Flow Schedule</h3>
        <CashFlowTable schedule={result.cashFlowSchedule} />
      </div>
    </div>
  );
}
