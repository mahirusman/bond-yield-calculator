import { body } from 'express-validator';
import { parseDecimal } from '@bond-calculator/shared';

function decimalField(field: string, message: string) {
  return body(field)
    .custom((value) => {
      parseDecimal(value);
      return true;
    })
    .withMessage(message)
    .customSanitizer((value) => String(value).trim());
}

export const validateBondInput = [
  decimalField('faceValue', 'Face value must be a positive number')
    .custom((value) => parseDecimal(value).gt(0))
    .withMessage('Face value must be a positive number'),

  decimalField('annualCouponRate', 'Annual coupon rate must be between 0 and 100')
    .custom((value) => {
      const decimalValue = parseDecimal(value);
      return decimalValue.gte(0) && decimalValue.lte(100);
    })
    .withMessage('Annual coupon rate must be between 0 and 100'),

  decimalField('marketPrice', 'Market price must be a positive number')
    .custom((value) => parseDecimal(value).gt(0))
    .withMessage('Market price must be a positive number'),

  decimalField('yearsToMaturity', 'Years to maturity must be at least 0.5')
    .custom((value) => parseDecimal(value).gte(0.5))
    .withMessage('Years to maturity must be at least 0.5'),

  body('couponFrequency')
    .isIn(['annual', 'semi-annual', 'quarterly'])
    .withMessage('Coupon frequency must be "annual", "semi-annual", or "quarterly"'),
];
