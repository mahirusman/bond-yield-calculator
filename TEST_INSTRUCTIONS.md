# Bond Yield Calculator — Test Case Writing Instructions

> **Purpose:** This document is a complete instruction prompt for writing test cases across all three packages of the `bond-yield-calculator` monorepo. Hand this file to any AI coding assistant or developer to generate or extend tests.

---

## Project Overview

| Property | Detail |
|---|---|
| Repo | `bond-yield-calculator` |
| Structure | npm workspaces monorepo |
| Language | TypeScript throughout |
| Test Runner | **Vitest** (already configured in `packages/shared`) |
| Decimal Library | `decimal.js` — all money/yield math is decimal-safe |
| API Style | REST, Express, single endpoint `POST /api/v1/bonds/calculate` |

### Packages

```
packages/
  shared/    → Pure financial calculation functions + shared types
  backend/   → Express REST API (controllers, services, validators, middleware)
  frontend/  → React + Vite UI (components, hooks, API layer)
```

---

## General Rules for All Tests

- Use **Vitest** (`describe`, `it`, `expect`, `beforeEach`, `vi.mock`)
- Use **React Testing Library** for frontend component tests
- Use **supertest** for backend HTTP integration tests
- Each `it()` block tests **one thing only**
- Write a short comment above each test block explaining WHAT it validates and WHY
- Group tests using nested `describe()` blocks by feature/scenario
- Use `beforeEach` to reset state and mocks between tests
- All financial assertions should use `.toBeCloseTo()` with precision 6 for yield values
- All money values must be strings with exactly 2 decimal places — assert with `.toMatch(/^\d+\.\d{2}$/)` or `.toBe("300.00")`
- Never assert raw JS floats — all values come back as **decimal strings** from the API

---

## Package 1: `packages/shared` — Unit Tests

**File:** `packages/shared/src/__tests__/bond-math.test.ts` *(already exists — extend it)*

Import from: `../utils/bond-math`

These are **pure functions** with no side effects. Test them exhaustively.

---

### 1. `calculateCurrentYield(annualCouponPayment, marketPrice)`

**Formula:** `annualCouponPayment / marketPrice`

```
describe('calculateCurrentYield', () => {
```

| Test Name | Input | Expected Output | Notes |
|---|---|---|---|
| standard discount bond | coupon=60, price=950 | ≈ 0.063157... | Core happy path |
| par bond | coupon=60, price=1000 | 0.06 exactly | yield = coupon rate |
| premium bond | coupon=60, price=1100 | < 0.06 | yield below coupon rate |
| discount bond | coupon=60, price=900 | > 0.06 | yield above coupon rate |
| high coupon rate | coupon=100, price=1000 | 0.10 | boundary check |
| very low market price | coupon=60, price=100 | 0.60 | large yield |
| zero coupon | coupon=0, price=950 | 0.00 | zero-coupon bond |
| price equals zero | coupon=60, price=0 | throws OR Infinity | document expected behavior |

---

### 2. `calculateYTM(faceValue, annualCouponPayment, marketPrice, periodsPerYear, totalPeriods)`

**Method:** Bisection numerical solver (not a closed-form formula)

```
describe('calculateYTM', () => {
```

| Test Name | Input | Expected Output | Tolerance |
|---|---|---|---|
| semi-annual discount bond | face=1000, coupon=60, price=950, freq=2, periods=10 | ≈ 0.072087 | ±0.000001 |
| at-par bond | price = face value | YTM = coupon rate exactly | ±0.000001 |
| premium bond | price=1050, face=1000, coupon=60 | YTM < 0.06 | ±0.000001 |
| discount bond | price=950 | YTM > 0.06 | ±0.000001 |
| annual frequency | periodsPerYear=1, totalPeriods=5 | valid number | — |
| quarterly frequency | periodsPerYear=4, totalPeriods=20 | valid number | — |
| 1 period remaining | totalPeriods=1 | valid number | edge case |
| zero-coupon bond | coupon=0, price=600, face=1000, 10yr | YTM > 0 | pure discount |
| 30-year bond | totalPeriods=60 (semi-annual) | valid number | long duration |

---

### 3. `calculateTotalInterest(annualCouponPayment, yearsToMaturity)`

**Formula:** `annualCouponPayment × yearsToMaturity`

```
describe('calculateTotalInterest', () => {
```

| Test Name | Input | Expected |
|---|---|---|
| standard 5yr | coupon=60, years=5 | "300.00" |
| 1-year bond | coupon=60, years=1 | "60.00" |
| 30-year bond | coupon=60, years=30 | "1800.00" |
| zero coupon | coupon=0, years=5 | "0.00" |
| high coupon | coupon=100, years=10 | "1000.00" |
| result is a string with 2 decimal places | any valid input | matches `/^\d+\.\d{2}$/` |

---

### 4. `calculatePremiumDiscount(faceValue, marketPrice)`

**Returns:** `{ status: 'premium' | 'discount' | 'par', difference: string }`

```
describe('calculatePremiumDiscount', () => {
```

| Test Name | Input | Expected |
|---|---|---|
| discount bond | face=1000, price=950 | `{ status: 'discount', difference: '50.00' }` |
| premium bond | face=1000, price=1100 | `{ status: 'premium', difference: '100.00' }` |
| par bond | face=1000, price=1000 | `{ status: 'par', difference: '0.00' }` |
| large premium | face=1000, price=1500 | `{ status: 'premium', difference: '500.00' }` |
| tiny difference | face=1000, price=1000.01 | `{ status: 'premium', difference: '0.01' }` |
| difference is always positive | price < face | difference string is positive number |

---

### 5. `generateCashFlowSchedule(faceValue, annualCouponPayment, periodsPerYear, totalPeriods, startDate?)`

**Returns:** Array of `{ period, paymentDate, couponPayment, cumulativeInterest, remainingPrincipal, isFinal }`

```
describe('generateCashFlowSchedule', () => {
```

| Test Name | Assertion |
|---|---|
| semi-annual 5yr → 10 periods | `result.length === 10` |
| annual 3yr → 3 periods | `result.length === 3` |
| quarterly 2yr → 8 periods | `result.length === 8` |
| last period `isFinal` is true | `result[result.length - 1].isFinal === true` |
| all other periods `isFinal` is false | every period except last has `isFinal === false` |
| couponPayment per period = annual/frequency | e.g., 60/2 = "30.00" |
| cumulativeInterest grows each period | `result[i].cumulativeInterest > result[i-1].cumulativeInterest` |
| remainingPrincipal = faceValue for non-final | all periods except last have `remainingPrincipal === faceValue.toString()` |
| paymentDates are spaced correctly | semi-annual = ~6 months, annual = ~12 months, quarterly = ~3 months |
| period numbers are sequential 1..N | `result[i].period === i + 1` |
| result is an array | `Array.isArray(result) === true` |

---

## Package 2: `packages/backend` — API Integration Tests

**File:** `packages/backend/src/__tests__/bond.api.test.ts` *(create new)*

```typescript
import request from 'supertest';
import app from '../app';
```

**Base URL:** `POST /api/v1/bonds/calculate`

---

### Group A — Happy Path (HTTP 200)

```
describe('POST /api/v1/bonds/calculate — success cases', () => {
```

| Test | Input | Assertion |
|---|---|---|
| semi-annual bond | freq="semi-annual", years=5 | `cashFlowSchedule.length === 10` |
| annual bond | freq="annual", years=3 | `cashFlowSchedule.length === 3` |
| quarterly bond | freq="quarterly", years=2 | `cashFlowSchedule.length === 8` |
| at-par bond | price=faceValue | `premiumDiscount.status === 'par'` |
| premium bond | price > faceValue | `premiumDiscount.status === 'premium'` |
| discount bond | price < faceValue | `premiumDiscount.status === 'discount'` |
| response shape | any valid input | `success === true`, has `data.currentYield`, `data.ytm`, `data.totalInterest`, `data.premiumDiscount`, `data.cashFlowSchedule`, `data.input` |
| input is echoed back | send known values | `data.input` matches request body exactly |
| values are decimal strings | any valid input | `currentYield` and `ytm` match `/^\d+\.\d+$/` |
| money values have 2 decimals | any valid input | `totalInterest` matches `/^\d+\.\d{2}$/` |
| large faceValue | faceValue="10000000" | HTTP 200, no error |
| decimal inputs | faceValue="1000.50", price="955.25" | HTTP 200, valid response |
| 1-year bond | yearsToMaturity="1" | HTTP 200, correct period count |
| 30-year bond | yearsToMaturity="30", freq="annual" | HTTP 200, `cashFlowSchedule.length === 30` |

**Standard valid payload to reuse:**
```json
{
  "faceValue": "1000",
  "annualCouponRate": "6",
  "marketPrice": "950",
  "yearsToMaturity": "5",
  "couponFrequency": "semi-annual"
}
```

---

### Group B — Validation Errors (HTTP 400)

```
describe('POST /api/v1/bonds/calculate — validation errors', () => {
```

Test each field individually. Every 400 response must have shape:
```json
{ "success": false, "errors": [{ "msg": "...", "path": "fieldName" }] }
```

**faceValue:**
| Test | Input | Error path |
|---|---|---|
| missing | omit field | `faceValue` |
| zero | `"0"` | `faceValue` |
| negative | `"-500"` | `faceValue` |
| non-numeric string | `"abc"` | `faceValue` |
| empty string | `""` | `faceValue` |

**annualCouponRate:**
| Test | Input | Error path |
|---|---|---|
| missing | omit field | `annualCouponRate` |
| negative | `"-1"` | `annualCouponRate` |
| non-numeric | `"high"` | `annualCouponRate` |
| empty string | `""` | `annualCouponRate` |

**marketPrice:**
| Test | Input | Error path |
|---|---|---|
| missing | omit field | `marketPrice` |
| zero | `"0"` | `marketPrice` |
| negative | `"-100"` | `marketPrice` |
| non-numeric | `"expensive"` | `marketPrice` |

**yearsToMaturity:**
| Test | Input | Error path |
|---|---|---|
| missing | omit field | `yearsToMaturity` |
| zero | `"0"` | `yearsToMaturity` |
| negative | `"-3"` | `yearsToMaturity` |
| non-numeric | `"five"` | `yearsToMaturity` |

**couponFrequency:**
| Test | Input | Error path |
|---|---|---|
| missing | omit field | `couponFrequency` |
| invalid enum | `"monthly"` | `couponFrequency` |
| wrong case | `"Semi-Annual"` | `couponFrequency` |
| empty string | `""` | `couponFrequency` |

**Multiple errors:**
| Test | Input | Assertion |
|---|---|---|
| empty body `{}` | `{}` | `errors.length > 1`, HTTP 400 |
| all empty strings | all fields `""` | HTTP 400, multiple error paths |

---

### Group C — Health Check

```
describe('GET /health', () => {
```

| Test | Expected |
|---|---|
| health endpoint returns 200 | `status === 200` |
| response indicates service is alive | some truthy response body |

---

### Group D — Error Response Shape Consistency

```
describe('Error response shape', () => {
```

- Every 400 response has `success === false`
- Every 400 response has `errors` as a non-empty array
- Every error object has `msg` (string) and `path` (string)
- 500 error handler: mock a service error and confirm `{ success: false, error: { message: "..." } }`

---

## Package 3: `packages/frontend` — Component & Hook Tests

**Test files to create:**

| File | Tests |
|---|---|
| `packages/frontend/src/__tests__/BondForm.test.tsx` | Form rendering, user input, submit |
| `packages/frontend/src/__tests__/ResultsPanel.test.tsx` | Results display, metric cards |
| `packages/frontend/src/__tests__/CashFlowTable.test.tsx` | Table rows, headers, final row |
| `packages/frontend/src/__tests__/useBondCalculator.test.ts` | Hook state machine |

Mock the API module with:
```typescript
vi.mock('../api/bond.api');
```

---

### BondForm.tsx

```
describe('BondForm', () => {
```

| Test | Assertion |
|---|---|
| renders Face Value input | field is present |
| renders Annual Coupon Rate input | field is present |
| renders Market Price input | field is present |
| renders Years to Maturity input | field is present |
| renders Coupon Frequency dropdown | select is present |
| frequency dropdown has "annual" option | option exists |
| frequency dropdown has "semi-annual" option | option exists |
| frequency dropdown has "quarterly" option | option exists |
| renders submit button | button is present |
| user can type into Face Value | input reflects typed value |
| user can type into Market Price | input reflects typed value |
| submit calls handler with correct values | handler called with form data |
| button disabled while loading | `disabled` attribute when `isLoading=true` |

---

### MetricCard.tsx

```
describe('MetricCard', () => {
```

| Test | Assertion |
|---|---|
| renders the label prop | label text visible |
| renders the value prop | value text visible |
| renders optional description | description shown when passed |
| snapshot test | matches snapshot |

---

### CashFlowTable.tsx

```
describe('CashFlowTable', () => {
```

| Test | Assertion |
|---|---|
| renders Period header | "Period" column exists |
| renders Payment Date header | "Payment Date" column exists |
| renders Coupon Payment header | column exists |
| renders Cumulative Interest header | column exists |
| renders Remaining Principal header | column exists |
| renders correct number of rows | `rows.length === data.length` |
| last row has final styling | final row has distinct class or marker |
| currency values show 2 decimal places | e.g., "$30.00" format |
| empty data renders no rows | 0 rows or empty state message |
| period numbers are displayed | 1, 2, 3... visible in rows |

---

### ResultsPanel.tsx

```
describe('ResultsPanel', () => {
```

| Test | Assertion |
|---|---|
| renders nothing when results is null | component returns null |
| renders Current Yield metric | label visible |
| renders YTM metric | label visible |
| renders Total Interest metric | label visible |
| renders Premium/Discount status | status string visible |
| renders CashFlowTable | table is present |
| premium bond shows "premium" text | discount status text visible |
| discount bond shows "discount" text | discount status text visible |
| par bond shows "par" text | par status text visible |

---

### useBondCalculator.ts (Custom Hook)

Use `renderHook` from `@testing-library/react`.

```
describe('useBondCalculator', () => {
```

| Test | Assertion |
|---|---|
| initial state: results is null | `results === null` |
| initial state: loading is false | `loading === false` |
| initial state: error is null | `error === null` |
| calling calculate sets loading=true | `loading === true` during call |
| successful response sets results | `results !== null` after resolve |
| successful response clears error | `error === null` after success |
| successful response sets loading=false | `loading === false` after resolve |
| 400 validation error sets error | `error` contains validation messages |
| 400 error clears results | `results === null` after error |
| network error sets error message | `error` is truthy |
| network error sets loading=false | `loading === false` after error |

---

## Financial Accuracy Reference

| Metric | Precision Rule | Example |
|---|---|---|
| YTM | `toBeCloseTo(expected, 6)` — 6 decimal places | `0.072087` |
| Current Yield | `toBeCloseTo(expected, 6)` | `0.063157` |
| Money (coupon, interest) | exact string match, 2 decimal places | `"300.00"` |
| Difference (premium/discount) | exact string match, 2 decimal places | `"50.00"` |

---

## Validation Boundary Reference

| Field | Min Valid | Invalid Below | Allowed Values |
|---|---|---|---|
| faceValue | `0.01` | `0` or negative | any positive decimal string |
| annualCouponRate | `0` | negative | `0` to `100` |
| marketPrice | `0.01` | `0` or negative | any positive decimal string |
| yearsToMaturity | `1` | `0` or negative | positive integer string |
| couponFrequency | — | — | `"annual"`, `"semi-annual"`, `"quarterly"` only |

---

## Test File Locations Summary

```
packages/
  shared/
    src/__tests__/bond-math.test.ts        ← EXISTS: extend with all cases above
  backend/
    src/__tests__/bond.api.test.ts         ← CREATE NEW
  frontend/
    src/__tests__/BondForm.test.tsx        ← CREATE NEW
    src/__tests__/ResultsPanel.test.tsx    ← CREATE NEW
    src/__tests__/CashFlowTable.test.tsx   ← CREATE NEW
    src/__tests__/useBondCalculator.test.ts ← CREATE NEW
```

---

## Run Tests

```bash
# All tests across all packages
npm test

# Shared unit tests only
npm test --workspace=packages/shared

# Backend tests only
npm test --workspace=packages/backend

# Frontend tests only
npm test --workspace=packages/frontend
```

---

## Instructions for AI Coding Assistants

When using this file to generate tests, follow this order:

1. **Start with `packages/shared`** — pure functions, no mocks needed, fastest to validate
2. **Then `packages/backend`** — needs `supertest` installed, import the Express `app`
3. **Then `packages/frontend`** — needs `vi.mock('../api/bond.api')` to mock API calls

For each file, generate ALL test cases listed above in the corresponding section. Do not skip edge cases or boundary values. Do not use raw JS float assertions — always assert on decimal strings or use `toBeCloseTo` with precision 6.
