import React from 'react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  accentColor?: string;
}

export function MetricCard({ title, value, description, accentColor }: MetricCardProps) {
  return (
    <div className={styles.card} style={accentColor ? { borderTopColor: accentColor } : undefined}>
      <p className={styles.title}>{title}</p>
      <p className={styles.value} style={accentColor ? { color: accentColor } : undefined}>
        {value}
      </p>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
