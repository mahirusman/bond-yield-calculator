import Decimal from 'decimal.js';

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -30,
  toExpPos: 30,
});

export { Decimal };

const DECIMAL_INPUT_PATTERN = /^-?\d+(?:\.\d+)?$/;

function addThousandsSeparators(integerPart: string): string {
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function normalizeDecimalInput(value: string | number): string {
  const normalized = String(value).trim();

  if (!DECIMAL_INPUT_PATTERN.test(normalized)) {
    throw new Error(`Invalid decimal input: ${value}`);
  }

  return normalized;
}

export function isValidDecimalInput(value: unknown): value is string | number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false;
  }

  try {
    normalizeDecimalInput(value);
    return true;
  } catch {
    return false;
  }
}

export function parseDecimal(value: string | number): Decimal {
  return new Decimal(normalizeDecimalInput(value));
}

export function roundMoney(value: Decimal): string {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN).toFixed(2);
}

export function roundYield(value: Decimal): string {
  return value.toDecimalPlaces(10, Decimal.ROUND_HALF_EVEN).toFixed(10);
}

export function formatCurrency(value: string): string {
  const [integerPart, fractionPart] = roundMoney(parseDecimal(value)).split('.');
  return `$${addThousandsSeparators(integerPart)}.${fractionPart}`;
}

export function formatPercent(value: string, decimalPlaces = 4): string {
  return `${parseDecimal(value).times(100).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_EVEN).toFixed(decimalPlaces)}%`;
}
