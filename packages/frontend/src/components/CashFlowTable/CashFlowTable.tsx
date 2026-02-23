import React, { useState } from 'react';
import { CashFlowPeriod } from '../../types';
import styles from './CashFlowTable.module.css';

interface CashFlowTableProps {
  schedule: CashFlowPeriod[];
}

const PAGE_SIZE = 10;

export function CashFlowTable({ schedule }: CashFlowTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(schedule.length / PAGE_SIZE);
  const visible = schedule.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table} aria-label="Bond cash flow schedule">
          <caption
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            Bond cash flow schedule by period
          </caption>
          <thead>
            <tr>
              <th>Period</th>
              <th>Payment Date</th>
              <th>Coupon Payment</th>
              <th>Cumulative Interest</th>
              <th>Remaining Principal</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.period} className={row.isFinal ? styles.finalRow : undefined}>
                <td>{row.period}</td>
                <td>{row.paymentDate}</td>
                <td>${fmt(row.couponPayment)}</td>
                <td>${fmt(row.cumulativeInterest)}</td>
                <td>${fmt(row.remainingPrincipal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — only show if more than PAGE_SIZE rows */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={styles.pageBtn}
          >
            ← Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages} ({schedule.length} total periods)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={styles.pageBtn}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
