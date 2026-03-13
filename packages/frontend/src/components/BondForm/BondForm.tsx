import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BondInput } from '../../types';
import { parseDecimal } from '../../utils/decimal';
import styles from './BondForm.module.css';

const decimalField = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, 'This field is required')
    .refine((value) => {
      try {
        parseDecimal(value);
        return true;
      } catch {
        return false;
      }
    }, `${fieldName} must be a valid decimal number`);

const bondSchema = z.object({
  faceValue: decimalField('Face value').refine((value) => parseDecimal(value).gt(0), 'Must be greater than 0'),
  annualCouponRate: decimalField('Annual coupon rate').refine((value) => {
    const decimalValue = parseDecimal(value);
    return decimalValue.gte(0) && decimalValue.lte(100);
  }, 'Cannot exceed 100%'),
  marketPrice: decimalField('Market price').refine((value) => parseDecimal(value).gt(0), 'Must be greater than 0'),
  yearsToMaturity: decimalField('Years to maturity').refine((value) => parseDecimal(value).gte(0.5), 'Must be at least 0.5 years'),
  couponFrequency: z.enum(['annual', 'semi-annual', 'quarterly']),
});

type BondFormValues = z.infer<typeof bondSchema>;

interface BondFormProps {
  onSubmit: (input: BondInput) => Promise<void>;
  loading: boolean;
}

export function BondForm({ onSubmit, loading }: BondFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BondFormValues>({
    resolver: zodResolver(bondSchema),
    defaultValues: {
      faceValue: '1000',
      annualCouponRate: '6',
      marketPrice: '950',
      yearsToMaturity: '5',
      couponFrequency: 'semi-annual',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
      <h2 className={styles.formTitle}>Bond Parameters</h2>

      {/* Face Value */}
      <div className={styles.fieldGroup}>
        <label htmlFor="faceValue" className={styles.label}>
          Face Value (Par Value)
        </label>
        <div className={styles.inputWrapper}>
          <span className={styles.prefix}>$</span>
          <input
            id="faceValue"
            type="number"
            step="0.01"
            className={`${styles.input} ${errors.faceValue ? styles.inputError : ''}`}
            {...register('faceValue')}
          />
        </div>
        {errors.faceValue && (
          <p className={styles.errorText} role="alert" aria-live="assertive">
            {errors.faceValue.message}
          </p>
        )}
        <p className={styles.hint}>The amount repaid at maturity (typically $1,000)</p>
      </div>

      {/* Annual Coupon Rate */}
      <div className={styles.fieldGroup}>
        <label htmlFor="annualCouponRate" className={styles.label}>
          Annual Coupon Rate
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="annualCouponRate"
            type="number"
            step="0.01"
            className={`${styles.input} ${errors.annualCouponRate ? styles.inputError : ''}`}
            {...register('annualCouponRate')}
          />
          <span className={styles.suffix}>%</span>
        </div>
        {errors.annualCouponRate && (
          <p className={styles.errorText} role="alert" aria-live="assertive">
            {errors.annualCouponRate.message}
          </p>
        )}
        <p className={styles.hint}>Annual interest rate stated on the bond</p>
      </div>

      {/* Market Price */}
      <div className={styles.fieldGroup}>
        <label htmlFor="marketPrice" className={styles.label}>
          Market Price
        </label>
        <div className={styles.inputWrapper}>
          <span className={styles.prefix}>$</span>
          <input
            id="marketPrice"
            type="number"
            step="0.01"
            className={`${styles.input} ${errors.marketPrice ? styles.inputError : ''}`}
            {...register('marketPrice')}
          />
        </div>
        {errors.marketPrice && (
          <p className={styles.errorText} role="alert" aria-live="assertive">
            {errors.marketPrice.message}
          </p>
        )}
        <p className={styles.hint}>Current price to buy the bond in the market</p>
      </div>

      {/* Years to Maturity */}
      <div className={styles.fieldGroup}>
        <label htmlFor="yearsToMaturity" className={styles.label}>
          Years to Maturity
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="yearsToMaturity"
            type="number"
            step="0.5"
            className={`${styles.input} ${errors.yearsToMaturity ? styles.inputError : ''}`}
            {...register('yearsToMaturity')}
          />
          <span className={styles.suffix}>years</span>
        </div>
        {errors.yearsToMaturity && (
          <p className={styles.errorText} role="alert" aria-live="assertive">
            {errors.yearsToMaturity.message}
          </p>
        )}
        <p className={styles.hint}>Time until the bond matures (minimum 0.5)</p>
      </div>

      {/* Coupon Frequency */}
      <div className={styles.fieldGroup}>
        <label htmlFor="couponFrequency" className={styles.label}>
          Coupon Frequency
        </label>
        <select
          id="couponFrequency"
          className={`${styles.select} ${errors.couponFrequency ? styles.inputError : ''}`}
          {...register('couponFrequency')}
        >
          <option value="annual">Annual (1× per year)</option>
          <option value="semi-annual">Semi-Annual (2× per year)</option>
          <option value="quarterly">Quarterly (4× per year)</option>
        </select>
        {errors.couponFrequency && (
          <p className={styles.errorText} role="alert" aria-live="assertive">
            {errors.couponFrequency.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
        aria-disabled={loading}
      >
        {loading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Calculating...
          </>
        ) : (
          'Calculate Yield'
        )}
      </button>
    </form>
  );
}
