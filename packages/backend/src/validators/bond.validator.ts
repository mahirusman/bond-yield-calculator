import { body } from 'express-validator';

export const validateBondInput = [
  body('faceValue').isFloat({ min: 1 }).withMessage('Face value must be a positive number'),

  body('annualCouponRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Annual coupon rate must be between 0 and 100'),

  body('marketPrice').isFloat({ min: 1 }).withMessage('Market price must be a positive number'),

  body('yearsToMaturity')
    .isFloat({ min: 0.5 })
    .withMessage('Years to maturity must be at least 0.5'),

  body('couponFrequency')
    .isIn(['annual', 'semi-annual'])
    .withMessage('Coupon frequency must be "annual" or "semi-annual"'),
];
