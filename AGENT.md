# Bond Yield Calculator — Full-Stack Monorepo: Complete Agent Instructions

> **Purpose of this file:** This document is a complete, self-contained specification for an AI coding agent to build a production-quality Bond Yield Calculator as a monorepo. Read every section carefully before writing a single line of code. Do not skip sections. Follow every instruction exactly.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Tech Stack & Versions](#3-tech-stack--versions)
4. [Domain Knowledge — Bond Finance](#4-domain-knowledge--bond-finance)
5. [Backend — Node.js / Express (TypeScript)](#5-backend--nodejs--express-typescript)
6. [Frontend — React (TypeScript)](#6-frontend--react-typescript)
7. [API Contract](#7-api-contract)
8. [Cash Flow Schedule Logic](#8-cash-flow-schedule-logic)
9. [Validation Rules](#9-validation-rules)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [Styling & UX Requirements](#11-styling--ux-requirements)
12. [GitHub & Repository Setup](#12-github--repository-setup)
13. [Environment & Configuration](#13-environment--configuration)
14. [Testing Requirements](#14-testing-requirements)
15. [Edge Cases & Complexity](#15-edge-cases--complexity)
16. [Step-by-Step Build Order WITH Git Commits](#16-step-by-step-build-order-with-git-commits)
17. [Definition of Done Checklist](#17-definition-of-done-checklist)
18. [Git Commit History Reference](#18-git-commit-history-reference)

---

## 1. Project Overview

### What Are We Building?

A **Bond Yield Calculator** — a full-stack web application that takes bond parameters as input and returns key financial metrics plus a full cash flow schedule. This is being built as a take-home interview task, so code quality, architecture decisions, and the ability to explain every line matters as much as the output.

### Who Will Use It?

Finance professionals, students, and developers learning about fixed-income instruments. The UI must be clean, professional, and self-explanatory.

### Key Financial Outputs

| Output | Description |
|--------|-------------|
| Current Yield | Annual coupon income ÷ current market price |
| Yield to Maturity (YTM) | The annualized return if the bond is held to maturity — requires iterative numerical solving |
| Total Interest Earned | Sum of all coupon payments over the life of the bond |
| Premium / Discount Indicator | Whether the bond trades above (premium) or below (discount) face value |
| Cash Flow Schedule | Period-by-period table of coupon payments, cumulative interest, and remaining principal |

---

## Financial Precision Rule

All financial calculations in this project must avoid raw JavaScript binary floating-point arithmetic in the calculation core.

Required rule set:

1. Parse numeric bond inputs as decimal strings at the API boundary.
2. Use `decimal.js` for financial math in the shared calculation layer.
3. Do not use `lodash`, `Math.round(value * 100) / 100`, or plain `number` arithmetic for money or yield calculations.
4. Apply deterministic rounding with `ROUND_HALF_EVEN`.
5. Return financial outputs as decimal strings from the backend.
6. Treat formatting for display as a frontend concern only after the backend result has been computed.

This rule exists to prevent IEEE-754 binary representation errors from leaking into production financial outputs.

## Test Maintenance Rule

Testing instructions and pull request automation are part of the project contract.

Required rule set:

1. Treat `TEST_INSTRUCTIONS.md` as the source of truth for expected test coverage.
2. Treat `.github/workflows/pr-checks.yml` as the required pull request workflow that runs automated verification on PRs to `main`.
3. If any functionality, validation rule, API behavior, supported frequency, UI behavior, or calculation logic changes, update `TEST_INSTRUCTIONS.md` accordingly in the same change set.
4. If test commands, test tooling, or PR verification behavior changes, update both `TEST_INSTRUCTIONS.md` and `.github/workflows/pr-checks.yml` as needed.
5. Documentation in `README.md` must remain consistent with the implemented test workflow and the current contents of `TEST_INSTRUCTIONS.md`.

---

## 2. Monorepo Structure

The entire project lives in one Git repository. Use the following directory layout exactly:

```
bond-yield-calculator/
├── package.json                  ← root monorepo package.json (workspaces)
├── .gitignore
├── .env.example
├── README.md
├── tsconfig.base.json            ← shared TypeScript config
│
├── packages/
│   ├── shared/                   ← shared TypeScript types used by both frontend and backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types/
│   │       │   ├── bond.types.ts
│   │       │   └── api.types.ts
│   │       └── utils/
│   │           └── bond-math.ts  ← ALL financial calculation logic lives here
│   │
│   ├── backend/                  ← Node.js + Express REST API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env
│   │   └── src/
│   │       ├── main.ts           ← Express app bootstrap
│   │       ├── app.ts            ← app factory (middleware, routes)
│   │       ├── config/
│   │       │   └── index.ts
│   │       ├── routes/
│   │       │   └── bond.routes.ts
│   │       ├── controllers/
│   │       │   └── bond.controller.ts
│   │       ├── services/
│   │       │   └── bond.service.ts
│   │       ├── validators/
│   │       │   └── bond.validator.ts
│   │       └── middleware/
│   │           ├── error.middleware.ts
│   │           └── cors.middleware.ts
│   │
│   └── frontend/                 ← React + Vite SPA
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── api/
│           │   └── bond.api.ts   ← axios calls to backend
│           ├── components/
│           │   ├── BondForm/
│           │   │   ├── BondForm.tsx
│           │   │   └── BondForm.module.css
│           │   ├── ResultsPanel/
│           │   │   ├── ResultsPanel.tsx
│           │   │   └── ResultsPanel.module.css
│           │   ├── CashFlowTable/
│           │   │   ├── CashFlowTable.tsx
│           │   │   └── CashFlowTable.module.css
│           │   ├── MetricCard/
│           │   │   ├── MetricCard.tsx
│           │   │   └── MetricCard.module.css
│           │   └── common/
│           │       ├── Loader.tsx
│           │       └── ErrorBanner.tsx
│           ├── hooks/
│           │   └── useBondCalculator.ts
│           ├── types/
│           │   └── index.ts      ← re-exports from shared package
│           └── styles/
│               └── global.css
```

### Monorepo Root `package.json`

```json
{
  "name": "bond-yield-calculator",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=packages/backend\" \"npm run dev --workspace=packages/frontend\"",
    "build": "npm run build --workspace=packages/shared && npm run build --workspace=packages/backend && npm run build --workspace=packages/frontend",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3"
  }
}
```

---

## 3. Tech Stack & Versions

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| node | ≥ 18.x | Runtime |
| typescript | ^5.3.x | Language |
| express | ^4.18.x | HTTP framework |
| cors | ^2.8.x | CORS middleware |
| helmet | ^7.x | Security headers |
| express-validator | ^7.x | Input validation |
| morgan | ^1.10.x | Request logging |
| dotenv | ^16.x | Environment variables |
| ts-node-dev | ^2.x | Dev server with hot reload |

**No NestJS.** The task description mentioned NestJS, but the user explicitly decided on plain Node.js + Express. Use Express only.

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.x | UI framework |
| react-dom | ^18.x | DOM rendering |
| typescript | ^5.3.x | Language |
| vite | ^5.x | Build tool + dev server |
| axios | ^1.6.x | HTTP client |
| react-hook-form | ^7.x | Form state management |
| @hookform/resolvers | ^3.x | Validation integration |
| zod | ^3.x | Schema validation (shared with backend) |

**No UI component library.** Write all CSS yourself using CSS Modules. This demonstrates CSS skill to the interviewer.

### Shared

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.3.x | Language |
| zod | ^3.x | Shared validation schemas |

---

## 4. Domain Knowledge — Bond Finance

Before writing any code, the agent must understand the financial concepts. Here is a complete explanation.

### 4.1 Bond Basics

A **bond** is a debt instrument. The **issuer** (a company or government) borrows money from **investors**. In return, the issuer promises to:
1. Pay periodic **coupon payments** (interest) to the investor.
2. Return the **face value** (also called par value or principal) at maturity.

### 4.2 Key Terms

- **Face Value (Par Value):** The amount the issuer will repay at maturity. Typically $1,000.
- **Annual Coupon Rate:** The stated interest rate as a percentage of face value. A 6% coupon on a $1,000 bond pays $60/year.
- **Market Price:** What the bond currently costs to buy in the market. May differ from face value.
- **Years to Maturity:** How many years until the issuer repays the face value.
- **Coupon Frequency:** How often coupon payments are made per year.
  - Annual = 1 payment per year
  - Semi-annual = 2 payments per year (most common in the US)

### 4.3 Current Yield

The simplest yield measure. Ignores time value of money.

```
Current Yield = (Annual Coupon Payment) / (Market Price)
Annual Coupon Payment = Face Value × Annual Coupon Rate
```

**Example:**
- Face Value: $1,000
- Annual Coupon Rate: 6%
- Market Price: $950
- Annual Coupon = $1,000 × 0.06 = $60
- Current Yield = $60 / $950 = 6.316%

### 4.4 Yield to Maturity (YTM)

YTM is the **annualized total return** if you buy the bond at the current market price, hold it until maturity, and reinvest all coupons at the YTM rate.

**YTM is NOT directly calculable with a simple formula.** It requires **numerical solving** — specifically, finding the discount rate `r` that makes the Present Value (PV) of all future cash flows equal to the current market price.

**The formula to solve:**

```
Market Price = Σ [Coupon / (1 + r/f)^t] + [Face Value / (1 + r/f)^N]

Where:
  t  = period number (1, 2, ..., N)
  N  = total number of periods (Years to Maturity × coupon frequency)
  f  = coupon frequency (1 for annual, 2 for semi-annual)
  r  = annual YTM (what we're solving for)
  Coupon = (Face Value × Annual Coupon Rate) / f  (per-period payment)
```

**Solving Method — Newton-Raphson Iteration (Bisection fallback):**

Use the **bisection method** for reliability. It is slower than Newton-Raphson but always converges and avoids derivative complexity.

```
Algorithm:
1. Set low = 0.0 (0% yield) and high = 1.0 (100% yield)
2. Calculate PV at mid = (low + high) / 2
3. If PV(mid) > Market Price, the yield is too low → set low = mid
4. If PV(mid) < Market Price, the yield is too high → set high = mid
5. Repeat until |PV(mid) - Market Price| < 0.0001 (convergence)
6. Max iterations: 1000
7. Return mid as the YTM
```

The agent MUST implement this in `packages/shared/src/utils/bond-math.ts`.

### 4.5 Premium vs Discount

| Condition | Term | Meaning |
|-----------|------|---------|
| Market Price > Face Value | Premium | Bond is expensive; YTM < Coupon Rate |
| Market Price < Face Value | Discount | Bond is cheap; YTM > Coupon Rate |
| Market Price = Face Value | Par | YTM = Coupon Rate |

### 4.6 Total Interest Earned

Simple calculation:
```
Total Interest Earned = Coupon per Period × Total Number of Periods
                     = (Face Value × Annual Coupon Rate / frequency) × (Years × frequency)
                     = Face Value × Annual Coupon Rate × Years
```

### 4.7 Cash Flow Schedule

The schedule shows every coupon payment date from today until maturity.

For each period `t`:
- **Period:** t (1, 2, 3, ..., N)
- **Payment Date:** Start date + (t × months per period)
  - Annual: +12 months per period
  - Semi-annual: +6 months per period
- **Coupon Payment:** Face Value × Annual Coupon Rate / frequency
- **Cumulative Interest:** Sum of all coupon payments from period 1 to t
- **Remaining Principal:** Always equal to Face Value (bonds don't amortize; principal is returned in full at maturity)
  - At the final period: show Face Value + final coupon in the coupon payment column (OR keep them separate — see Section 8)

---

## 5. Backend — Node.js / Express (TypeScript)

### 5.1 App Bootstrap (`packages/backend/src/main.ts`)

```typescript
import 'dotenv/config';
import { createApp } from './app';

const PORT = process.env.PORT || 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Bond Yield Calculator API running on http://localhost:${PORT}`);
});
```

### 5.2 App Factory (`packages/backend/src/app.ts`)

```typescript
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import bondRoutes from './routes/bond.routes';

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  
  // CORS — allow frontend origin
  app.use(corsMiddleware);
  
  // Logging
  app.use(morgan('dev'));
  
  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/v1', bondRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler — must be last
  app.use(errorMiddleware);

  return app;
}
```

### 5.3 Routes (`packages/backend/src/routes/bond.routes.ts`)

```typescript
import { Router } from 'express';
import { calculateBond } from '../controllers/bond.controller';
import { validateBondInput } from '../validators/bond.validator';

const router = Router();

// POST /api/v1/bonds/calculate
router.post('/bonds/calculate', validateBondInput, calculateBond);

export default router;
```

### 5.4 Controller (`packages/backend/src/controllers/bond.controller.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { BondService } from '../services/bond.service';

const bondService = new BondService();

export async function calculateBond(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const result = bondService.calculate(req.body);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
```

### 5.5 Service (`packages/backend/src/services/bond.service.ts`)

```typescript
import {
  BondInput,
  BondCalculationResult,
} from '@bond-calculator/shared';
import {
  calculateCurrentYield,
  calculateYTM,
  calculateTotalInterest,
  generateCashFlowSchedule,
  determinePremiumDiscount,
} from '@bond-calculator/shared';

export class BondService {
  calculate(input: BondInput): BondCalculationResult {
    const currentYield = calculateCurrentYield(input);
    const ytm = calculateYTM(input);
    const totalInterest = calculateTotalInterest(input);
    const cashFlowSchedule = generateCashFlowSchedule(input);
    const premiumDiscount = determinePremiumDiscount(input);

    return {
      currentYield,
      ytm,
      totalInterest,
      cashFlowSchedule,
      premiumDiscount,
      // Echo back the input for frontend convenience
      input,
    };
  }
}
```

### 5.6 Validator (`packages/backend/src/validators/bond.validator.ts`)

```typescript
import { body } from 'express-validator';

export const validateBondInput = [
  body('faceValue')
    .isFloat({ min: 1 })
    .withMessage('Face value must be a positive number'),

  body('annualCouponRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Annual coupon rate must be between 0 and 100'),

  body('marketPrice')
    .isFloat({ min: 1 })
    .withMessage('Market price must be a positive number'),

  body('yearsToMaturity')
    .isFloat({ min: 0.5 })
    .withMessage('Years to maturity must be at least 0.5'),

  body('couponFrequency')
    .isIn(['annual', 'semi-annual'])
    .withMessage('Coupon frequency must be "annual" or "semi-annual"'),
];
```

### 5.7 CORS Middleware (`packages/backend/src/middleware/cors.middleware.ts`)

```typescript
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173', // Vite default
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

### 5.8 Error Middleware (`packages/backend/src/middleware/error.middleware.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[ERROR]', err.message, err.stack);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
```

---

## 6. Frontend — React (TypeScript)

### 6.1 Main Entry (`packages/frontend/src/main.tsx`)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 6.2 App Component (`packages/frontend/src/App.tsx`)

```tsx
import React, { useState } from 'react';
import { BondForm } from './components/BondForm/BondForm';
import { ResultsPanel } from './components/ResultsPanel/ResultsPanel';
import { useBondCalculator } from './hooks/useBondCalculator';
import { BondInput } from './types';

export default function App() {
  const { result, loading, error, calculate } = useBondCalculator();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Bond Yield Calculator</h1>
        <p>Calculate key metrics and cash flow schedules for fixed-income instruments</p>
      </header>

      <main className="app-main">
        <section className="form-section">
          <BondForm onSubmit={calculate} loading={loading} />
        </section>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {result && (
          <section className="results-section">
            <ResultsPanel result={result} />
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>Bond Yield Calculator — Financial calculations performed server-side</p>
      </footer>
    </div>
  );
}
```

### 6.3 Custom Hook (`packages/frontend/src/hooks/useBondCalculator.ts`)

```typescript
import { useState, useCallback } from 'react';
import { BondInput, BondCalculationResult } from '../types';
import { calculateBond } from '../api/bond.api';

interface UseBondCalculatorReturn {
  result: BondCalculationResult | null;
  loading: boolean;
  error: string | null;
  calculate: (input: BondInput) => Promise<void>;
}

export function useBondCalculator(): UseBondCalculatorReturn {
  const [result, setResult] = useState<BondCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: BondInput) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await calculateBond(input);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Calculation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, calculate };
}
```

### 6.4 API Client (`packages/frontend/src/api/bond.api.ts`)

```typescript
import axios from 'axios';
import { BondInput, BondCalculationResult } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.errors) {
      // Validation errors from express-validator
      const messages = error.response.data.errors.map((e: any) => e.msg).join(', ');
      return Promise.reject(new Error(messages));
    }
    if (error.response?.data?.error?.message) {
      return Promise.reject(new Error(error.response.data.error.message));
    }
    return Promise.reject(new Error('Network error. Please check your connection.'));
  }
);

export async function calculateBond(input: BondInput): Promise<BondCalculationResult> {
  const response = await apiClient.post<{ success: boolean; data: BondCalculationResult }>(
    '/bonds/calculate',
    input
  );
  return response.data.data;
}
```

### 6.5 BondForm Component (`packages/frontend/src/components/BondForm/BondForm.tsx`)

The form must use `react-hook-form` with `zod` validation. All five inputs are required. The component must:

- Show inline validation errors below each field in red.
- Disable the submit button while loading.
- Show a spinner inside the button while loading.
- Use `<label>` elements properly associated with `<input>` via `htmlFor`.
- Show currency symbol prefix for monetary fields.
- Show percent suffix for rate field.

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BondInput } from '../../types';
import styles from './BondForm.module.css';

const bondSchema = z.object({
  faceValue: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Must be greater than 0'),
  annualCouponRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  marketPrice: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Must be greater than 0'),
  yearsToMaturity: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0.5, 'Must be at least 0.5 years'),
  couponFrequency: z.enum(['annual', 'semi-annual']),
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
      faceValue: 1000,
      annualCouponRate: 6,
      marketPrice: 950,
      yearsToMaturity: 5,
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
            {...register('faceValue', { valueAsNumber: true })}
          />
        </div>
        {errors.faceValue && (
          <p className={styles.errorText}>{errors.faceValue.message}</p>
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
            {...register('annualCouponRate', { valueAsNumber: true })}
          />
          <span className={styles.suffix}>%</span>
        </div>
        {errors.annualCouponRate && (
          <p className={styles.errorText}>{errors.annualCouponRate.message}</p>
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
            {...register('marketPrice', { valueAsNumber: true })}
          />
        </div>
        {errors.marketPrice && (
          <p className={styles.errorText}>{errors.marketPrice.message}</p>
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
            {...register('yearsToMaturity', { valueAsNumber: true })}
          />
          <span className={styles.suffix}>years</span>
        </div>
        {errors.yearsToMaturity && (
          <p className={styles.errorText}>{errors.yearsToMaturity.message}</p>
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
        </select>
        {errors.couponFrequency && (
          <p className={styles.errorText}>{errors.couponFrequency.message}</p>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
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
```

### 6.6 ResultsPanel Component

The ResultsPanel renders four MetricCards plus the CashFlowTable.

```tsx
// packages/frontend/src/components/ResultsPanel/ResultsPanel.tsx
import React from 'react';
import { BondCalculationResult } from '../../types';
import { MetricCard } from '../MetricCard/MetricCard';
import { CashFlowTable } from '../CashFlowTable/CashFlowTable';
import styles from './ResultsPanel.module.css';

interface ResultsPanelProps {
  result: BondCalculationResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
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
          value={`${(currentYield * 100).toFixed(4)}%`}
          description="Annual coupon ÷ market price"
        />
        <MetricCard
          title="Yield to Maturity (YTM)"
          value={`${(ytm * 100).toFixed(4)}%`}
          description="Total annualized return if held to maturity"
        />
        <MetricCard
          title="Total Interest Earned"
          value={`$${totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="Sum of all coupon payments over bond life"
        />
        <MetricCard
          title={premiumDiscount.status.charAt(0).toUpperCase() + premiumDiscount.status.slice(1)}
          value={`$${Math.abs(premiumDiscount.difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          description={premiumDiscount.status === 'premium'
            ? 'Bond trades above face value'
            : premiumDiscount.status === 'discount'
            ? 'Bond trades below face value'
            : 'Bond trades at face value'}
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
```

### 6.7 MetricCard Component

```tsx
// packages/frontend/src/components/MetricCard/MetricCard.tsx
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
```

### 6.8 CashFlowTable Component

```tsx
// packages/frontend/src/components/CashFlowTable/CashFlowTable.tsx
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
        <table className={styles.table}>
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
```

---

## 7. API Contract

### POST `/api/v1/bonds/calculate`

**Request Body:**

```json
{
  "faceValue": 1000,
  "annualCouponRate": 6,
  "marketPrice": 950,
  "yearsToMaturity": 5,
  "couponFrequency": "semi-annual"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "currentYield": 0.063158,
    "ytm": 0.071567,
    "totalInterest": 300.00,
    "premiumDiscount": {
      "status": "discount",
      "difference": 50.00
    },
    "cashFlowSchedule": [
      {
        "period": 1,
        "paymentDate": "2024-08-23",
        "couponPayment": 30.00,
        "cumulativeInterest": 30.00,
        "remainingPrincipal": 1000.00,
        "isFinal": false
      },
      ...
      {
        "period": 10,
        "paymentDate": "2029-02-23",
        "couponPayment": 30.00,
        "cumulativeInterest": 300.00,
        "remainingPrincipal": 1000.00,
        "isFinal": true
      }
    ],
    "input": {
      "faceValue": 1000,
      "annualCouponRate": 6,
      "marketPrice": 950,
      "yearsToMaturity": 5,
      "couponFrequency": "semi-annual"
    }
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "errors": [
    { "msg": "Face value must be a positive number", "path": "faceValue" }
  ]
}
```

**Error Response (500):**

```json
{
  "success": false,
  "error": {
    "message": "Internal server error"
  }
}
```

---

## 8. Cash Flow Schedule Logic

This is the most complex part. Implement it carefully in `packages/shared/src/utils/bond-math.ts`.

### Date Generation

- Use the **current date** as the start date for period calculations.
- For each period `t` (1 to N):
  - Annual frequency: payment date = start date + (t × 12 months)
  - Semi-annual frequency: payment date = start date + (t × 6 months)
- Format dates as `YYYY-MM-DD` strings.
- Use JavaScript's native `Date` object. Do NOT import any date library (keeps bundle small).

```typescript
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  
  // Handle month-end edge case (e.g., Jan 31 + 1 month = Feb 28)
  if (result.getDate() !== day) {
    result.setDate(0); // Last day of previous month
  }
  
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
```

### Final Period Logic

The last period row is special. The bond matures — the issuer pays back the face value. The coupon payment column should show ONLY the coupon amount. Add a separate note in `isFinal: true`. The frontend can use `isFinal` to highlight the final row and show that the face value is also returned.

Do NOT add the face value to the coupon payment amount in the table, as it would misrepresent the coupon. Instead, the frontend should display "Face value returned: $X,XXX" below the final row.

### Remaining Principal

For all periods: `remainingPrincipal = faceValue` (bonds are non-amortizing).

---

## 9. Validation Rules

Apply these on BOTH backend (express-validator) and frontend (zod). Defence in depth.

| Field | Rule |
|-------|------|
| `faceValue` | Required, number, > 0 |
| `annualCouponRate` | Required, number, >= 0, <= 100 |
| `marketPrice` | Required, number, > 0 |
| `yearsToMaturity` | Required, number, >= 0.5 |
| `couponFrequency` | Required, must be "annual" or "semi-annual" |

**Special case — zero coupon bond:** `annualCouponRate` of 0 is valid. A zero-coupon bond has no coupon payments. Handle this:
- Current yield = 0
- YTM calculation still works (all cash flows are 0 until maturity, then face value is returned)
- Total interest = 0
- Cash flow schedule: all coupon payments are $0.00

---

## 10. Error Handling Strategy

### Backend

- All route handlers are wrapped in `try/catch` that passes to `next(error)`.
- The `errorMiddleware` is the single place that sends error responses.
- Never expose stack traces in production (`NODE_ENV !== 'development'`).
- Log errors with `console.error` (or a proper logger in production).
- Validation errors return 400, not 500.
- Calculation errors (e.g., YTM divergence) return 422 Unprocessable Entity.

### Frontend

- Network errors are caught in the axios interceptor and converted to friendly messages.
- Validation errors from the backend are concatenated and displayed in the error banner.
- The custom hook (`useBondCalculator`) manages loading/error state.
- Never show raw JavaScript error objects to the user.
- The form itself validates client-side first, so most users never see a network error.

### YTM Calculation Edge Cases

- If the bisection method does not converge in 1000 iterations, throw an error with message: `"YTM calculation did not converge. Please check your bond parameters."`
- If `marketPrice` equals `faceValue`, YTM equals the coupon rate exactly. Short-circuit this.
- If `annualCouponRate` is 0 (zero-coupon bond), YTM = `(faceValue / marketPrice)^(1/yearsToMaturity) - 1`.

---

## 11. Styling & UX Requirements

Write all CSS using CSS Modules (`.module.css` files). No external UI library. No Tailwind.

### Design Principles

- **Professional finance aesthetic:** Dark navy header, white card backgrounds, subtle shadows.
- **Responsive:** Works on mobile (375px) through desktop (1440px+).
- **Accessible:** All form fields have `<label>`, error messages use `role="alert"`, color is not the only indicator of state.
- **Clean typography:** Use system font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.

### Color Palette

```css
:root {
  --color-bg: #f8fafc;
  --color-header-bg: #0f172a;
  --color-header-text: #f1f5f9;
  --color-card-bg: #ffffff;
  --color-border: #e2e8f0;
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-accent-blue: #2563eb;
  --color-success: #16a34a;
  --color-danger: #dc2626;
  --color-warning: #d97706;
  --color-shadow: rgba(0, 0, 0, 0.08);
}
```

### Global CSS (`packages/frontend/src/styles/global.css`)

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  line-height: 1.6;
  font-size: 16px;
}

/* Smooth number transitions */
.metric-value {
  font-variant-numeric: tabular-nums;
}
```

### Layout

The app should have:
- Full-width dark header
- Two-column layout on desktop (form on left ~35%, results on right ~65%)
- Single column stacked layout on mobile
- The cash flow table should be horizontally scrollable on mobile

### Form Styling

- Inputs have clear focus states (blue border, box shadow)
- Error states: red border, red error text below field
- Submit button: full-width, blue, shows spinner when loading
- Prefix/suffix decorators for currency and percent symbols

### Table Styling

- Zebra striping (alternate row background)
- Sticky header
- Final row highlighted with a light yellow background
- Numbers right-aligned
- Dates left-aligned

---

## 12. GitHub & Repository Setup

### Critical Rule: One Commit Per Completed Task

> **The agent MUST commit after every individual task is completed — not at the end of the entire project.** Each commit represents a single working unit of change. This gives the interviewer the ability to browse the git history and see exactly what was built at each step, check out any specific commit, and understand the thought process and build order.
>
> **Never batch multiple tasks into one commit.** Never commit at the very end with all files at once. Follow the commit instructions in Section 16 exactly — every phase and sub-task has its own commit command.

### Repository Initialization (Before Any Code)

```bash
# Step 1: Initialize git FIRST — before creating any files
git init
git branch -M main

# Step 2: Create ONLY the .gitignore and .env.example as the very first commit
# (Create these two files, then:)
git add .gitignore .env.example
git commit -m "chore: initialize repository with gitignore and env example"
```

After this, every subsequent task in Section 16 has its own `git add` and `git commit` command. Follow them in order.

### Connecting to GitHub (After All Local Commits Are Done)

Only do this AFTER all local commits from Section 16 are complete:

```bash
# Create the repo on GitHub (via github.com or GitHub CLI)
# Then connect and push ALL commits at once:
git remote add origin https://github.com/<your-username>/bond-yield-calculator.git
git push -u origin main
```

All commit history will be preserved and visible on GitHub exactly as built.

### `.gitignore` File (root)

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment files
.env
.env.local
.env.*.local
!.env.example

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# TypeScript
*.js.map
```

### `.env.example` File

```env
# Backend
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Frontend (prefix with VITE_ to expose to client)
VITE_API_URL=http://localhost:3001/api/v1
```

### Commit Message Convention

All commits follow the **Conventional Commits** format. This is enforced throughout Section 16:

```
<type>(<scope>): <short description>

Types used in this project:
  chore   → setup, config, tooling (no production code)
  feat    → new feature or file
  test    → adding or updating tests
  docs    → README or documentation only
  fix     → bug fix (used if agent corrects something during build)
  refactor→ restructuring without changing behavior
```

### README.md (Root)

The README must contain:
1. Project description and screenshot placeholder
2. Architecture overview (monorepo structure)
3. Prerequisites (Node.js ≥ 18, npm ≥ 9)
4. Setup instructions (clone, install, run)
5. Development commands
6. API documentation (endpoint, request/response examples)
7. Financial concepts explained briefly
8. Project structure tree
9. Running tests

---

## 13. Environment & Configuration

### Backend `.env`

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls during development to avoid CORS issues
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### TypeScript Configuration

`tsconfig.base.json` (root):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

`packages/backend/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

`packages/frontend/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

---

## 14. Testing Requirements

Write tests for the most critical piece: the financial calculation logic in `packages/shared/src/utils/bond-math.ts`.

Use **Jest** for the shared package. Install: `jest`, `@types/jest`, `ts-jest`.

### Test File: `packages/shared/src/__tests__/bond-math.test.ts`

Write tests for the following scenarios. Each test must have a clearly named `describe` and `it` block:

```typescript
describe('calculateCurrentYield', () => {
  it('should calculate current yield correctly for a discount bond', () => {
    // faceValue: 1000, annualCouponRate: 6, marketPrice: 950
    // Expected: ~0.06316 (6.316%)
  });

  it('should calculate current yield for a premium bond', () => {
    // faceValue: 1000, annualCouponRate: 6, marketPrice: 1050
    // Expected: ~0.05714 (5.714%)
  });

  it('should return 0 for zero-coupon bond', () => {
    // annualCouponRate: 0
    // Expected: 0
  });
});

describe('calculateYTM', () => {
  it('should equal coupon rate when bond is priced at par', () => {
    // faceValue: 1000, annualCouponRate: 6, marketPrice: 1000
    // Expected: ~0.06 (within tolerance)
  });

  it('should be higher than coupon rate for discount bond', () => {
    // marketPrice < faceValue → YTM > coupon rate
  });

  it('should be lower than coupon rate for premium bond', () => {
    // marketPrice > faceValue → YTM < coupon rate
  });

  it('should handle semi-annual coupon frequency', () => {
    // Verify semi-annual calculation is different from annual
  });

  it('should handle zero-coupon bond', () => {
    // annualCouponRate: 0, faceValue: 1000, marketPrice: 620, yearsToMaturity: 5
    // Expected: (1000/620)^(1/5) - 1 ≈ 0.1 (10%)
  });
});

describe('generateCashFlowSchedule', () => {
  it('should generate correct number of periods for annual bond', () => {
    // yearsToMaturity: 5, frequency: annual → 5 periods
  });

  it('should generate correct number of periods for semi-annual bond', () => {
    // yearsToMaturity: 5, frequency: semi-annual → 10 periods
  });

  it('should correctly mark the last period as isFinal: true', () => {});

  it('should calculate cumulative interest correctly', () => {});

  it('should keep remainingPrincipal equal to faceValue throughout', () => {});
});

describe('determinePremiumDiscount', () => {
  it('should return "premium" when market price > face value', () => {});
  it('should return "discount" when market price < face value', () => {});
  it('should return "par" when market price === face value', () => {});
});
```

**Test accuracy tolerance:** For YTM, allow ±0.0001 (0.01%) tolerance. Use `toBeCloseTo(expected, 4)`.

---

## 15. Edge Cases & Complexity

The agent must handle ALL of the following without crashing:

### Financial Edge Cases

| Case | Input | Expected Behavior |
|------|-------|-------------------|
| Zero-coupon bond | `annualCouponRate: 0` | Current yield = 0, YTM uses pure discount formula, all coupon payments in schedule = $0 |
| Par bond | `marketPrice === faceValue` | YTM equals annual coupon rate exactly; premiumDiscount status = "par" |
| Very short bond | `yearsToMaturity: 0.5` | Only 1 period for semi-annual, schedule has 1 row |
| Very long bond | `yearsToMaturity: 30` | 60 periods for semi-annual, schedule has 60 rows, table is paginated |
| High coupon rate | `annualCouponRate: 99` | Valid; current yield approaches 99% if at par |
| Deep discount | `marketPrice: 1, faceValue: 1000` | Very high YTM; bisection must converge |
| Deep premium | `marketPrice: 1999, faceValue: 1000` | Very low/negative effective yield; handle gracefully |
| Fractional years | `yearsToMaturity: 2.5` | Semi-annual → 5 periods; annual → floor to 2 periods (document this behavior) |

### Technical Edge Cases

- **Month-end date arithmetic:** January 31 + 1 month = February 28 (not March 2). Use the `addMonths` function from Section 8.
- **Floating-point precision:** Round all currency values to 2 decimal places before returning from the backend. Use `Math.round(value * 100) / 100`.
- **Large numbers:** Face values like $1,000,000 must display correctly with commas (`$1,000,000.00`).
- **YTM convergence:** If the bisection does not converge in 1000 iterations, return a 422 error with an explanation message.
- **Concurrent requests:** The Express app is stateless — all calculations are pure functions. No state shared between requests.

### Fractional Year Handling

When `yearsToMaturity` is not a whole multiple of the coupon period:
- Example: 2.5 years with annual payments → 2.5 periods. The agent should round to the nearest whole period using `Math.round(yearsToMaturity * frequency)`.
- The actual total periods: `totalPeriods = Math.round(yearsToMaturity * frequency)`.
- Document this assumption in a code comment.

---

## 16. Step-by-Step Build Order WITH Git Commits

> **AGENT RULE — READ BEFORE STARTING:**
> - Every task below ends with a `🔲 COMMIT` block. **Execute the git commands exactly as written immediately after completing that task.** Do not continue to the next task until the commit is done.
> - Each commit captures one logical unit of work. The goal is a clean, readable git history where the interviewer can check out any commit and see the project at that exact point in time.
> - `git add` only the files listed in each commit block — do not use `git add .` unless explicitly instructed.
> - If a task modifies an existing file, include that file in the commit for that task.

---

### Phase 1: Repository & Monorepo Scaffold

---

#### Task 1.1 — Initialize Git Repository

Actions:
1. Create the root project directory: `bond-yield-calculator/`
2. Run `git init` inside it
3. Run `git branch -M main`

```bash
# No commit yet — nothing to commit
```

---

#### Task 1.2 — Create .gitignore and .env.example

Actions:
1. Create `.gitignore` (full content from Section 12)
2. Create `.env.example` (full content from Section 12)

🔲 **COMMIT:**
```bash
git add .gitignore .env.example
git commit -m "chore: initialize repo with gitignore and env example"
```

---

#### Task 1.3 — Create Root Monorepo Config

Actions:
1. Create root `package.json` with workspaces config (content from Section 2)
2. Create `tsconfig.base.json` (content from Section 13)
3. Create empty `packages/` directory (add a `.gitkeep` inside so git tracks it)
4. Run `npm install` from the root to initialize the lockfile

🔲 **COMMIT:**
```bash
git add package.json tsconfig.base.json packages/.gitkeep package-lock.json
git commit -m "chore: add monorepo root package.json and base tsconfig"
```

---

#### Task 1.4 — Create Root README

Actions:
1. Create `README.md` with all required sections from Section 12 (use placeholder text for any sections that reference files not yet created)

🔲 **COMMIT:**
```bash
git add README.md
git commit -m "docs: add project README with setup instructions and architecture overview"
```

---

### Phase 2: Shared Package — Types & Financial Logic

---

#### Task 2.1 — Shared Package Scaffold

Actions:
1. Create `packages/shared/package.json`
2. Create `packages/shared/tsconfig.json` (content from Section 13)
3. Create empty directories: `packages/shared/src/types/` and `packages/shared/src/utils/`

🔲 **COMMIT:**
```bash
git add packages/shared/package.json packages/shared/tsconfig.json
git commit -m "chore(shared): scaffold shared package with package.json and tsconfig"
```

---

#### Task 2.2 — TypeScript Types

Actions:
1. Create `packages/shared/src/types/bond.types.ts` (full content from Appendix A)
2. Create `packages/shared/src/types/api.types.ts`

`api.types.ts` content:
```typescript
import { BondCalculationResult, BondInput } from './bond.types';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    stack?: string;
  };
}

export interface ApiValidationErrorResponse {
  success: false;
  errors: Array<{ msg: string; path: string }>;
}

export type BondCalculateRequest = BondInput;
export type BondCalculateResponse = ApiSuccessResponse<BondCalculationResult>;
```

🔲 **COMMIT:**
```bash
git add packages/shared/src/types/bond.types.ts packages/shared/src/types/api.types.ts
git commit -m "feat(shared): add TypeScript types for bond domain and API contracts"
```

---

#### Task 2.3 — Bond Math Utility Functions

Actions:
1. Create `packages/shared/src/utils/bond-math.ts` — implement ALL functions (full content from Appendix B):
   - `calculateCurrentYield`
   - `calculateYTM` (bisection method)
   - `calculateTotalInterest`
   - `determinePremiumDiscount`
   - `generateCashFlowSchedule`
   - All private helpers

🔲 **COMMIT:**
```bash
git add packages/shared/src/utils/bond-math.ts
git commit -m "feat(shared): implement bond math utilities — YTM bisection, current yield, cash flow schedule"
```

---

#### Task 2.4 — Shared Package Entry Point

Actions:
1. Create `packages/shared/src/index.ts` that re-exports everything:

```typescript
// Types
export * from './types/bond.types';
export * from './types/api.types';

// Utilities
export * from './utils/bond-math';
```

2. Run `npm install --workspace=packages/shared`
3. Verify it compiles without errors: `npx tsc -p packages/shared/tsconfig.json`

🔲 **COMMIT:**
```bash
git add packages/shared/src/index.ts
git commit -m "feat(shared): add package entry point and verify TypeScript compilation"
```

---

### Phase 3: Backend — Express API

---

#### Task 3.1 — Backend Package Scaffold

Actions:
1. Create `packages/backend/package.json` with all backend dependencies
2. Create `packages/backend/tsconfig.json` (content from Section 13)
3. Run `npm install --workspace=packages/backend`
4. Create `packages/backend/src/` directory structure (all empty subdirectories: `config/`, `routes/`, `controllers/`, `services/`, `validators/`, `middleware/`)

🔲 **COMMIT:**
```bash
git add packages/backend/package.json packages/backend/tsconfig.json
git commit -m "chore(backend): scaffold backend package with dependencies and tsconfig"
```

---

#### Task 3.2 — Backend Configuration

Actions:
1. Create `packages/backend/src/config/index.ts`:

```typescript
export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  isDevelopment: process.env.NODE_ENV !== 'production',
};
```

2. Create `packages/backend/.env` by copying from root `.env.example` (this file is gitignored — do NOT commit it)

🔲 **COMMIT:**
```bash
git add packages/backend/src/config/index.ts
git commit -m "chore(backend): add environment config module"
```

---

#### Task 3.3 — Middleware

Actions:
1. Create `packages/backend/src/middleware/cors.middleware.ts` (full content from Section 5.7)
2. Create `packages/backend/src/middleware/error.middleware.ts` (full content from Section 5.8)

🔲 **COMMIT:**
```bash
git add packages/backend/src/middleware/cors.middleware.ts packages/backend/src/middleware/error.middleware.ts
git commit -m "feat(backend): add CORS and global error handling middleware"
```

---

#### Task 3.4 — Input Validator

Actions:
1. Create `packages/backend/src/validators/bond.validator.ts` (full content from Section 5.6)

🔲 **COMMIT:**
```bash
git add packages/backend/src/validators/bond.validator.ts
git commit -m "feat(backend): add express-validator rules for bond calculation input"
```

---

#### Task 3.5 — Bond Service

Actions:
1. Create `packages/backend/src/services/bond.service.ts` (full content from Section 5.5)

🔲 **COMMIT:**
```bash
git add packages/backend/src/services/bond.service.ts
git commit -m "feat(backend): add BondService that orchestrates financial calculations"
```

---

#### Task 3.6 — Bond Controller

Actions:
1. Create `packages/backend/src/controllers/bond.controller.ts` (full content from Section 5.4)

🔲 **COMMIT:**
```bash
git add packages/backend/src/controllers/bond.controller.ts
git commit -m "feat(backend): add bond controller to handle HTTP request/response cycle"
```

---

#### Task 3.7 — Routes

Actions:
1. Create `packages/backend/src/routes/bond.routes.ts` (full content from Section 5.3)

🔲 **COMMIT:**
```bash
git add packages/backend/src/routes/bond.routes.ts
git commit -m "feat(backend): add POST /api/v1/bonds/calculate route"
```

---

#### Task 3.8 — App Factory and Server Entry Point

Actions:
1. Create `packages/backend/src/app.ts` (full content from Section 5.2) — this wires together all middleware and routes
2. Create `packages/backend/src/main.ts` (full content from Section 5.1) — this starts the server
3. Add `dev` script to `packages/backend/package.json`:
   ```json
   "scripts": {
     "dev": "ts-node-dev --respawn --transpile-only src/main.ts",
     "build": "tsc",
     "start": "node dist/main.js"
   }
   ```

🔲 **COMMIT:**
```bash
git add packages/backend/src/app.ts packages/backend/src/main.ts
git commit -m "feat(backend): add Express app factory and server bootstrap — API ready"
```

---

#### Task 3.9 — Verify Backend Works

Actions:
1. Start the backend: `npm run dev --workspace=packages/backend`
2. Run this curl command and verify the response matches Section 7 exactly:
   ```bash
   curl -X POST http://localhost:3001/api/v1/bonds/calculate \
     -H "Content-Type: application/json" \
     -d '{
       "faceValue": 1000,
       "annualCouponRate": 6,
       "marketPrice": 950,
       "yearsToMaturity": 5,
       "couponFrequency": "semi-annual"
     }'
   ```
3. Also verify the health endpoint: `curl http://localhost:3001/health`
4. Also test validation — send an invalid body and confirm a 400 response with error messages
5. Stop the server after verification

> No new files — this is a verification step only. No commit needed.

---

### Phase 4: Frontend — React App

---

#### Task 4.1 — Frontend Package Scaffold

Actions:
1. Create `packages/frontend/package.json` with all frontend dependencies
2. Create `packages/frontend/tsconfig.json` (content from Section 13)
3. Create `packages/frontend/vite.config.ts` (content from Section 13)
4. Create `packages/frontend/index.html`:
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Bond Yield Calculator</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   ```
5. Run `npm install --workspace=packages/frontend`

🔲 **COMMIT:**
```bash
git add packages/frontend/package.json packages/frontend/tsconfig.json packages/frontend/vite.config.ts packages/frontend/index.html
git commit -m "chore(frontend): scaffold React+Vite frontend package with dependencies"
```

---

#### Task 4.2 — Global Styles and Type Re-exports

Actions:
1. Create `packages/frontend/src/styles/global.css` — CSS variables, reset, base styles (full content from Section 11)
2. Create `packages/frontend/src/types/index.ts`:
   ```typescript
   // Re-export all shared types for use within the frontend package
   export type {
     BondInput,
     BondCalculationResult,
     CashFlowPeriod,
     PremiumDiscount,
     PremiumDiscountStatus,
     CouponFrequency,
   } from '@bond-calculator/shared';
   ```

🔲 **COMMIT:**
```bash
git add packages/frontend/src/styles/global.css packages/frontend/src/types/index.ts
git commit -m "feat(frontend): add global CSS design system and shared type re-exports"
```

---

#### Task 4.3 — API Client

Actions:
1. Create `packages/frontend/src/api/bond.api.ts` (full content from Section 6.4)

🔲 **COMMIT:**
```bash
git add packages/frontend/src/api/bond.api.ts
git commit -m "feat(frontend): add axios API client with error interceptor for bond calculation"
```

---

#### Task 4.4 — Custom Hook

Actions:
1. Create `packages/frontend/src/hooks/useBondCalculator.ts` (full content from Section 6.3)

🔲 **COMMIT:**
```bash
git add packages/frontend/src/hooks/useBondCalculator.ts
git commit -m "feat(frontend): add useBondCalculator hook to manage calculation state"
```

---

#### Task 4.5 — Common Components

Actions:
1. Create `packages/frontend/src/components/common/Loader.tsx`:
   ```tsx
   import React from 'react';

   export function Loader() {
     return (
       <div className="loader" role="status" aria-label="Loading">
         <span className="loader-spinner" />
         <span className="loader-text">Calculating...</span>
       </div>
     );
   }
   ```
2. Create `packages/frontend/src/components/common/ErrorBanner.tsx`:
   ```tsx
   import React from 'react';

   interface ErrorBannerProps {
     message: string;
   }

   export function ErrorBanner({ message }: ErrorBannerProps) {
     return (
       <div className="error-banner" role="alert" aria-live="assertive">
         <strong>Error:</strong> {message}
       </div>
     );
   }
   ```

🔲 **COMMIT:**
```bash
git add packages/frontend/src/components/common/Loader.tsx packages/frontend/src/components/common/ErrorBanner.tsx
git commit -m "feat(frontend): add common Loader and ErrorBanner components"
```

---

#### Task 4.6 — MetricCard Component

Actions:
1. Create `packages/frontend/src/components/MetricCard/MetricCard.tsx` (full content from Section 6.7)
2. Create `packages/frontend/src/components/MetricCard/MetricCard.module.css`:
   ```css
   .card {
     background: var(--color-card-bg);
     border: 1px solid var(--color-border);
     border-top: 4px solid var(--color-accent-blue);
     border-radius: 8px;
     padding: 20px 24px;
     box-shadow: 0 1px 4px var(--color-shadow);
     display: flex;
     flex-direction: column;
     gap: 6px;
   }
   .title {
     font-size: 0.78rem;
     font-weight: 600;
     text-transform: uppercase;
     letter-spacing: 0.06em;
     color: var(--color-text-secondary);
   }
   .value {
     font-size: 1.75rem;
     font-weight: 700;
     color: var(--color-accent-blue);
     font-variant-numeric: tabular-nums;
     line-height: 1.2;
   }
   .description {
     font-size: 0.8rem;
     color: var(--color-text-secondary);
   }
   ```

🔲 **COMMIT:**
```bash
git add packages/frontend/src/components/MetricCard/MetricCard.tsx packages/frontend/src/components/MetricCard/MetricCard.module.css
git commit -m "feat(frontend): add MetricCard component for displaying key bond metrics"
```

---

#### Task 4.7 — CashFlowTable Component

Actions:
1. Create `packages/frontend/src/components/CashFlowTable/CashFlowTable.tsx` (full content from Section 6.8)
2. Create `packages/frontend/src/components/CashFlowTable/CashFlowTable.module.css`:
   ```css
   .wrapper { margin-top: 16px; }
   .tableContainer { overflow-x: auto; border-radius: 8px; border: 1px solid var(--color-border); }
   .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
   .table thead { background: var(--color-header-bg); color: var(--color-header-text); }
   .table th { padding: 12px 16px; text-align: left; font-weight: 600; white-space: nowrap; }
   .table th:nth-child(n+3) { text-align: right; }
   .table td { padding: 10px 16px; border-bottom: 1px solid var(--color-border); }
   .table td:nth-child(n+3) { text-align: right; font-variant-numeric: tabular-nums; }
   .table tbody tr:nth-child(even) { background: #f8fafc; }
   .table tbody tr:hover { background: #eff6ff; }
   .finalRow td { background: #fefce8 !important; font-weight: 600; }
   .pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; gap: 12px; flex-wrap: wrap; }
   .pageBtn { padding: 6px 16px; border: 1px solid var(--color-border); border-radius: 6px; background: white; cursor: pointer; font-size: 0.875rem; }
   .pageBtn:disabled { opacity: 0.4; cursor: not-allowed; }
   .pageBtn:not(:disabled):hover { background: var(--color-accent-blue); color: white; border-color: var(--color-accent-blue); }
   .pageInfo { font-size: 0.8rem; color: var(--color-text-secondary); }
   ```

🔲 **COMMIT:**
```bash
git add packages/frontend/src/components/CashFlowTable/CashFlowTable.tsx packages/frontend/src/components/CashFlowTable/CashFlowTable.module.css
git commit -m "feat(frontend): add CashFlowTable component with pagination for bond schedule"
```

---

#### Task 4.8 — BondForm Component

Actions:
1. Create `packages/frontend/src/components/BondForm/BondForm.tsx` (full content from Section 6.5)
2. Create `packages/frontend/src/components/BondForm/BondForm.module.css`:
   ```css
   .form { background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 28px; box-shadow: 0 2px 8px var(--color-shadow); }
   .formTitle { font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; color: var(--color-text-primary); }
   .fieldGroup { display: flex; flex-direction: column; gap: 4px; margin-bottom: 18px; }
   .label { font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary); }
   .inputWrapper { position: relative; display: flex; align-items: center; }
   .prefix { position: absolute; left: 12px; color: var(--color-text-secondary); font-weight: 500; pointer-events: none; }
   .suffix { position: absolute; right: 12px; color: var(--color-text-secondary); font-weight: 500; pointer-events: none; font-size: 0.875rem; }
   .input { width: 100%; padding: 10px 40px 10px 28px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 1rem; color: var(--color-text-primary); background: white; transition: border-color 0.15s, box-shadow 0.15s; }
   .input:focus { outline: none; border-color: var(--color-accent-blue); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
   .inputError { border-color: var(--color-danger) !important; }
   .inputError:focus { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15) !important; }
   .select { width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 1rem; color: var(--color-text-primary); background: white; cursor: pointer; }
   .select:focus { outline: none; border-color: var(--color-accent-blue); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
   .errorText { font-size: 0.8rem; color: var(--color-danger); font-weight: 500; }
   .hint { font-size: 0.78rem; color: var(--color-text-secondary); }
   .submitButton { width: 100%; padding: 12px; background: var(--color-accent-blue); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s; margin-top: 8px; }
   .submitButton:hover:not(:disabled) { background: #1d4ed8; }
   .submitButton:disabled { opacity: 0.65; cursor: not-allowed; }
   .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
   @keyframes spin { to { transform: rotate(360deg); } }
   ```

🔲 **COMMIT:**
```bash
git add packages/frontend/src/components/BondForm/BondForm.tsx packages/frontend/src/components/BondForm/BondForm.module.css
git commit -m "feat(frontend): add BondForm component with react-hook-form and zod validation"
```

---

#### Task 4.9 — ResultsPanel Component

Actions:
1. Create `packages/frontend/src/components/ResultsPanel/ResultsPanel.tsx` (full content from Section 6.6)
2. Create `packages/frontend/src/components/ResultsPanel/ResultsPanel.module.css`:
   ```css
   .panel { display: flex; flex-direction: column; gap: 24px; }
   .panelTitle { font-size: 1.1rem; font-weight: 700; color: var(--color-text-primary); }
   .metricsGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
   @media (max-width: 640px) { .metricsGrid { grid-template-columns: 1fr; } }
   .tableSection h3 { font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
   ```

🔲 **COMMIT:**
```bash
git add packages/frontend/src/components/ResultsPanel/ResultsPanel.tsx packages/frontend/src/components/ResultsPanel/ResultsPanel.module.css
git commit -m "feat(frontend): add ResultsPanel component to display all bond calculation outputs"
```

---

#### Task 4.10 — App Root and Entry Point

Actions:
1. Create `packages/frontend/src/App.tsx` (full content from Section 6.2)
2. Create `packages/frontend/src/main.tsx` (full content from Section 6.1)
3. Add dev script to `packages/frontend/package.json`:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "tsc && vite build",
     "preview": "vite preview"
   }
   ```

🔲 **COMMIT:**
```bash
git add packages/frontend/src/App.tsx packages/frontend/src/main.tsx
git commit -m "feat(frontend): wire up App root component and React entry point — frontend complete"
```

---

#### Task 4.11 — Verify Full Stack Works End-to-End

Actions:
1. Start backend: `npm run dev --workspace=packages/backend`
2. Start frontend: `npm run dev --workspace=packages/frontend`
3. Open `http://localhost:5173`
4. Verify: form renders with default values
5. Submit the form — verify all 4 metric cards appear
6. Verify the cash flow schedule table renders
7. Test pagination (use yearsToMaturity: 30, semi-annual → 60 rows → 6 pages)
8. Resize to 375px width — verify layout stacks vertically
9. Submit invalid data — verify inline form errors appear
10. Test zero-coupon bond: annualCouponRate = 0 — verify $0.00 coupon payments in schedule

> This is a verification step. If all passes, no code changes needed. If fixes are required, commit fixes with:

```bash
git add <fixed files>
git commit -m "fix(frontend): resolve end-to-end integration issues"
```

---

### Phase 5: Tests

---

#### Task 5.1 — Jest Setup for Shared Package

Actions:
1. Install Jest dependencies in the shared package:
   ```bash
   npm install --save-dev jest @types/jest ts-jest --workspace=packages/shared
   ```
2. Add Jest config to `packages/shared/package.json`:
   ```json
   "scripts": {
     "test": "jest"
   },
   "jest": {
     "preset": "ts-jest",
     "testEnvironment": "node",
     "testMatch": ["**/__tests__/**/*.test.ts"]
   }
   ```

🔲 **COMMIT:**
```bash
git add packages/shared/package.json
git commit -m "chore(shared): configure Jest and ts-jest for unit testing"
```

---

#### Task 5.2 — Unit Tests for calculateCurrentYield

Actions:
1. Create `packages/shared/src/__tests__/bond-math.test.ts`
2. Write ONLY the `calculateCurrentYield` describe block (all scenarios from Section 14)
3. Run: `npm test --workspace=packages/shared` — all tests in this block must pass

🔲 **COMMIT:**
```bash
git add packages/shared/src/__tests__/bond-math.test.ts
git commit -m "test(shared): add unit tests for calculateCurrentYield"
```

---

#### Task 5.3 — Unit Tests for calculateYTM

Actions:
1. Add the `calculateYTM` describe block to the existing test file (all scenarios from Section 14)
2. Run: `npm test --workspace=packages/shared` — all tests must pass

🔲 **COMMIT:**
```bash
git add packages/shared/src/__tests__/bond-math.test.ts
git commit -m "test(shared): add unit tests for calculateYTM including edge cases"
```

---

#### Task 5.4 — Unit Tests for Cash Flow Schedule and Premium/Discount

Actions:
1. Add the `generateCashFlowSchedule` describe block to the test file
2. Add the `determinePremiumDiscount` describe block to the test file
3. Run: `npm test --workspace=packages/shared` — ALL tests across all describe blocks must pass

🔲 **COMMIT:**
```bash
git add packages/shared/src/__tests__/bond-math.test.ts
git commit -m "test(shared): add unit tests for cash flow schedule generation and premium/discount logic"
```

---

### Phase 6: Polish & Final Touches

---

#### Task 6.1 — Mobile Responsive Fixes

Actions:
1. Test the app at 375px viewport width
2. Fix any layout issues (table overflow, form spacing, metric grid stacking)
3. Ensure the cash flow table is horizontally scrollable on mobile

🔲 **COMMIT (only if changes were needed):**
```bash
git add packages/frontend/src/styles/global.css packages/frontend/src/components/**/*.module.css
git commit -m "fix(frontend): improve mobile responsive layout at 375px viewport"
```

---

#### Task 6.2 — Accessibility Pass

Actions:
1. Verify all `<input>` elements have associated `<label>` via `htmlFor`
2. Verify error messages use `role="alert"` or `aria-live`
3. Verify the submit button communicates loading state via `aria-disabled` or descriptive text
4. Verify the table has a `<caption>` or `aria-label`
5. Fix any accessibility issues found

🔲 **COMMIT (only if changes were needed):**
```bash
git add packages/frontend/src/components/**/*.tsx
git commit -m "fix(frontend): accessibility improvements — aria labels, roles, and keyboard support"
```

---

#### Task 6.3 — Error State UX

Actions:
1. Kill the backend and try to submit the form — verify a friendly error message appears ("Network error. Please check your connection.")
2. Submit with an annualCouponRate that is a string — verify backend validation error displays
3. Ensure no raw JSON or stack traces are ever visible to the user

🔲 **COMMIT (only if changes were needed):**
```bash
git add packages/frontend/src/api/bond.api.ts packages/frontend/src/hooks/useBondCalculator.ts
git commit -m "fix(frontend): improve error message handling for network and validation failures"
```

---

#### Task 6.4 — Final README Update

Actions:
1. Update `README.md` to reflect the completed project:
   - Replace any placeholder text
   - Add the full project structure tree
   - Add the API endpoint documentation with example request/response
   - Add the "Running Tests" section with exact commands
   - Add a "Financial Concepts" section briefly explaining YTM, current yield, premium/discount

🔲 **COMMIT:**
```bash
git add README.md
git commit -m "docs: finalize README with complete setup guide, API docs, and financial concepts"
```

---

#### Task 6.5 — Final Verification and Git Log Review

Actions:
1. Run `git log --oneline` and verify you see a clean history similar to:
   ```
   abc1234 docs: finalize README with complete setup guide, API docs, and financial concepts
   bcd2345 fix(frontend): improve error message handling for network and validation failures
   cde3456 fix(frontend): accessibility improvements — aria labels, roles, and keyboard support
   def4567 fix(frontend): improve mobile responsive layout at 375px viewport
   efg5678 test(shared): add unit tests for cash flow schedule generation and premium/discount logic
   fgh6789 test(shared): add unit tests for calculateYTM including edge cases
   ghi7890 test(shared): add unit tests for calculateCurrentYield
   hij8901 chore(shared): configure Jest and ts-jest for unit testing
   ijk9012 feat(frontend): wire up App root component and React entry point — frontend complete
   jkl0123 feat(frontend): add ResultsPanel component to display all bond calculation outputs
   klm1234 feat(frontend): add BondForm component with react-hook-form and zod validation
   lmn2345 feat(frontend): add CashFlowTable component with pagination for bond schedule
   mno3456 feat(frontend): add MetricCard component for displaying key bond metrics
   nop4567 feat(frontend): add common Loader and ErrorBanner components
   opq5678 feat(frontend): add useBondCalculator hook to manage calculation state
   pqr6789 feat(frontend): add axios API client with error interceptor for bond calculation
   qrs7890 feat(frontend): add global CSS design system and shared type re-exports
   rst8901 chore(frontend): scaffold React+Vite frontend package with dependencies
   stu9012 feat(backend): add Express app factory and server bootstrap — API ready
   tuv0123 feat(backend): add POST /api/v1/bonds/calculate route
   uvw1234 feat(backend): add bond controller to handle HTTP request/response cycle
   vwx2345 feat(backend): add BondService that orchestrates financial calculations
   wxy3456 feat(backend): add express-validator rules for bond calculation input
   xyz4567 feat(backend): add CORS and global error handling middleware
   yza5678 chore(backend): add environment config module
   zab6789 chore(backend): scaffold backend package with dependencies and tsconfig
   abc7890 feat(shared): add package entry point and verify TypeScript compilation
   bcd8901 feat(shared): implement bond math utilities — YTM bisection, current yield, cash flow schedule
   cde9012 feat(shared): add TypeScript types for bond domain and API contracts
   def0123 chore(shared): scaffold shared package with package.json and tsconfig
   efg1234 docs: add project README with setup instructions and architecture overview
   fgh2345 chore: add monorepo root package.json and base tsconfig
   ghi3456 chore: initialize repo with gitignore and env example
   ```
2. Run `npm test` from the root — all tests must pass
3. Run `npm run build` from the root — all packages must build without errors

> No commit for this task — it is verification only.

---

### Phase 7: Push to GitHub

---

#### Task 7.1 — Connect Remote and Push

Actions:
1. Create a new **public** repository on GitHub named `bond-yield-calculator` (do NOT initialize with README — the local repo already has one)
2. Connect the remote:
   ```bash
   git remote add origin https://github.com/<your-username>/bond-yield-calculator.git
   ```
3. Push all commits:
   ```bash
   git push -u origin main
   ```
4. Open GitHub in the browser and verify:
   - All commits are visible in the commit history
   - Each commit shows only the files changed for that specific task
   - The repository is public
   - The README renders correctly on the repository home page

---

## 17. Definition of Done Checklist

Before considering the project complete, verify EVERY item:

### Functionality
- [ ] All 5 inputs render with proper labels, types, and defaults
- [ ] Form validates client-side with inline error messages
- [ ] Backend validates server-side independently
- [ ] Current Yield calculated and displayed as percentage
- [ ] YTM calculated and displayed as percentage
- [ ] Total Interest displayed as currency
- [ ] Premium/Discount indicator shows status and dollar difference
- [ ] Cash Flow Schedule table renders with all 5 columns
- [ ] Table is paginated for bonds with > 10 periods
- [ ] Zero-coupon bond works (all coupon payments = $0)
- [ ] Par bond works (YTM = coupon rate)
- [ ] Short bonds (0.5 years) work
- [ ] Long bonds (30 years) work

### Code Quality
- [ ] TypeScript strict mode — no `any` types (except where unavoidable in middleware)
- [ ] All calculation logic is in the shared package, not duplicated
- [ ] No business logic in controllers — controllers only call service
- [ ] No hardcoded values — all config comes from env variables
- [ ] Error handling covers all code paths
- [ ] Consistent code formatting

### UX
- [ ] Loading state shown while API call is in progress
- [ ] Error messages are user-friendly (no raw error objects)
- [ ] Responsive on mobile (375px)
- [ ] Responsive on desktop (1440px)
- [ ] Form has default values so users can calculate immediately
- [ ] Numbers formatted with commas and decimal places

### Repository
- [ ] `.gitignore` present and correct (no `node_modules` committed)
- [ ] `.env.example` present with all required variables
- [ ] Actual `.env` files NOT committed
- [ ] README is complete with setup instructions
- [ ] Repository is public on GitHub
- [ ] All source code is committed

### Testing
- [ ] Unit tests for `calculateCurrentYield`
- [ ] Unit tests for `calculateYTM`
- [ ] Unit tests for `generateCashFlowSchedule`
- [ ] Unit tests for `determinePremiumDiscount`
- [ ] All tests pass: `npm test`

---

## Appendix A: Complete TypeScript Types

Place these in `packages/shared/src/types/bond.types.ts`:

```typescript
export type CouponFrequency = 'annual' | 'semi-annual';

export interface BondInput {
  faceValue: number;
  annualCouponRate: number; // percentage, e.g., 6 for 6%
  marketPrice: number;
  yearsToMaturity: number;
  couponFrequency: CouponFrequency;
}

export interface CashFlowPeriod {
  period: number;
  paymentDate: string; // ISO date string: YYYY-MM-DD
  couponPayment: number;
  cumulativeInterest: number;
  remainingPrincipal: number;
  isFinal: boolean;
}

export type PremiumDiscountStatus = 'premium' | 'discount' | 'par';

export interface PremiumDiscount {
  status: PremiumDiscountStatus;
  difference: number; // Math.abs(marketPrice - faceValue)
}

export interface BondCalculationResult {
  currentYield: number; // decimal, e.g., 0.06316
  ytm: number; // decimal, e.g., 0.07157
  totalInterest: number; // dollar amount
  premiumDiscount: PremiumDiscount;
  cashFlowSchedule: CashFlowPeriod[];
  input: BondInput; // echo back
}
```

---

## Appendix B: Complete Bond Math Implementation

Place this in `packages/shared/src/utils/bond-math.ts`. This is the heart of the application. Implement every function:

```typescript
import { BondInput, BondCalculationResult, CashFlowPeriod, PremiumDiscount } from '../types/bond.types';

// ============================================================
// CONSTANTS
// ============================================================
const CONVERGENCE_TOLERANCE = 0.0001;
const MAX_ITERATIONS = 1000;

// ============================================================
// HELPER: Get coupon frequency as a number
// ============================================================
function getFrequencyNumber(input: BondInput): number {
  return input.couponFrequency === 'semi-annual' ? 2 : 1;
}

// ============================================================
// HELPER: Calculate coupon payment per period
// ============================================================
function getCouponPerPeriod(input: BondInput): number {
  const frequency = getFrequencyNumber(input);
  return (input.faceValue * (input.annualCouponRate / 100)) / frequency;
}

// ============================================================
// HELPER: Calculate total number of periods
// ============================================================
function getTotalPeriods(input: BondInput): number {
  const frequency = getFrequencyNumber(input);
  // Round to nearest whole period to handle fractional years
  return Math.round(input.yearsToMaturity * frequency);
}

// ============================================================
// HELPER: Calculate present value of bond at given yield rate
// Used by the YTM bisection solver
// ============================================================
function calculatePV(input: BondInput, annualYield: number): number {
  const frequency = getFrequencyNumber(input);
  const totalPeriods = getTotalPeriods(input);
  const couponPerPeriod = getCouponPerPeriod(input);
  const periodicRate = annualYield / frequency;

  let pv = 0;

  // Sum PV of all coupon payments
  for (let t = 1; t <= totalPeriods; t++) {
    pv += couponPerPeriod / Math.pow(1 + periodicRate, t);
  }

  // Add PV of face value at maturity
  pv += input.faceValue / Math.pow(1 + periodicRate, totalPeriods);

  return pv;
}

// ============================================================
// HELPER: Add months to a date (handles month-end edge cases)
// ============================================================
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetDay = result.getDate();
  result.setMonth(result.getMonth() + months);
  // Handle month-end overflow (e.g., Jan 31 → Feb 28)
  if (result.getDate() !== targetDay) {
    result.setDate(0);
  }
  return result;
}

// ============================================================
// HELPER: Format date as YYYY-MM-DD
// ============================================================
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================
// HELPER: Round to 2 decimal places
// ============================================================
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ============================================================
// EXPORTED: Calculate Current Yield
// ============================================================
export function calculateCurrentYield(input: BondInput): number {
  if (input.annualCouponRate === 0) return 0;
  const annualCoupon = input.faceValue * (input.annualCouponRate / 100);
  return annualCoupon / input.marketPrice;
}

// ============================================================
// EXPORTED: Calculate YTM using Bisection Method
// ============================================================
export function calculateYTM(input: BondInput): number {
  // Zero-coupon bond shortcut
  if (input.annualCouponRate === 0) {
    return Math.pow(input.faceValue / input.marketPrice, 1 / input.yearsToMaturity) - 1;
  }

  // Par bond shortcut
  if (Math.abs(input.marketPrice - input.faceValue) < 0.01) {
    return input.annualCouponRate / 100;
  }

  let low = 0.0;  // 0% annual yield
  let high = 1.0; // 100% annual yield
  let mid = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    mid = (low + high) / 2;
    const pvAtMid = calculatePV(input, mid);
    const diff = pvAtMid - input.marketPrice;

    if (Math.abs(diff) < CONVERGENCE_TOLERANCE) {
      return mid;
    }

    if (diff > 0) {
      // PV is too high → yield is too low → increase low
      low = mid;
    } else {
      // PV is too low → yield is too high → decrease high
      high = mid;
    }
  }

  // If we exit the loop without converging, throw an error
  throw new Error(
    'YTM calculation did not converge. Please verify your bond parameters are realistic.'
  );
}

// ============================================================
// EXPORTED: Calculate Total Interest Earned
// ============================================================
export function calculateTotalInterest(input: BondInput): number {
  const couponPerPeriod = getCouponPerPeriod(input);
  const totalPeriods = getTotalPeriods(input);
  return round2(couponPerPeriod * totalPeriods);
}

// ============================================================
// EXPORTED: Determine Premium or Discount
// ============================================================
export function determinePremiumDiscount(input: BondInput): PremiumDiscount {
  const diff = input.marketPrice - input.faceValue;
  const absDiff = round2(Math.abs(diff));

  if (diff > 0.005) {
    return { status: 'premium', difference: absDiff };
  } else if (diff < -0.005) {
    return { status: 'discount', difference: absDiff };
  } else {
    return { status: 'par', difference: 0 };
  }
}

// ============================================================
// EXPORTED: Generate Cash Flow Schedule
// ============================================================
export function generateCashFlowSchedule(input: BondInput): CashFlowPeriod[] {
  const frequency = getFrequencyNumber(input);
  const totalPeriods = getTotalPeriods(input);
  const couponPerPeriod = getCouponPerPeriod(input);
  const monthsPerPeriod = 12 / frequency; // 12 for annual, 6 for semi-annual
  const startDate = new Date();
  const schedule: CashFlowPeriod[] = [];

  let cumulativeInterest = 0;

  for (let t = 1; t <= totalPeriods; t++) {
    const paymentDate = addMonths(startDate, t * monthsPerPeriod);
    cumulativeInterest += couponPerPeriod;

    schedule.push({
      period: t,
      paymentDate: formatDate(paymentDate),
      couponPayment: round2(couponPerPeriod),
      cumulativeInterest: round2(cumulativeInterest),
      remainingPrincipal: round2(input.faceValue),
      isFinal: t === totalPeriods,
    });
  }

  return schedule;
}
```

---

## Appendix C: Development Commands Reference

```bash
# Install all dependencies (from root)
npm install

# Start both frontend and backend simultaneously
npm run dev

# Start only backend
npm run dev --workspace=packages/backend

# Start only frontend
npm run dev --workspace=packages/frontend

# Build everything
npm run build

# Run all tests
npm test

# Run only shared package tests
npm test --workspace=packages/shared

# Type-check all packages
npx tsc --build
```

---

## 18. Git Commit History Reference

This section is a quick-reference summary of every expected commit, in chronological order (oldest at bottom, newest at top, matching `git log --oneline` output). Use this to verify your history is correct before pushing to GitHub.

| # | Commit Message | Phase | What It Contains |
|---|---------------|-------|-----------------|
| 31 | `docs: finalize README with complete setup guide, API docs, and financial concepts` | 6 | Final README |
| 30 | `fix(frontend): improve error message handling for network and validation failures` | 6 | api client, hook |
| 29 | `fix(frontend): accessibility improvements — aria labels, roles, and keyboard support` | 6 | component tsx files |
| 28 | `fix(frontend): improve mobile responsive layout at 375px viewport` | 6 | CSS modules |
| 27 | `test(shared): add unit tests for cash flow schedule generation and premium/discount logic` | 5 | bond-math.test.ts |
| 26 | `test(shared): add unit tests for calculateYTM including edge cases` | 5 | bond-math.test.ts |
| 25 | `test(shared): add unit tests for calculateCurrentYield` | 5 | bond-math.test.ts |
| 24 | `chore(shared): configure Jest and ts-jest for unit testing` | 5 | shared package.json |
| 23 | `feat(frontend): wire up App root component and React entry point — frontend complete` | 4 | App.tsx, main.tsx |
| 22 | `feat(frontend): add ResultsPanel component to display all bond calculation outputs` | 4 | ResultsPanel |
| 21 | `feat(frontend): add BondForm component with react-hook-form and zod validation` | 4 | BondForm |
| 20 | `feat(frontend): add CashFlowTable component with pagination for bond schedule` | 4 | CashFlowTable |
| 19 | `feat(frontend): add MetricCard component for displaying key bond metrics` | 4 | MetricCard |
| 18 | `feat(frontend): add common Loader and ErrorBanner components` | 4 | Loader, ErrorBanner |
| 17 | `feat(frontend): add useBondCalculator hook to manage calculation state` | 4 | hook |
| 16 | `feat(frontend): add axios API client with error interceptor for bond calculation` | 4 | bond.api.ts |
| 15 | `feat(frontend): add global CSS design system and shared type re-exports` | 4 | global.css, types |
| 14 | `chore(frontend): scaffold React+Vite frontend package with dependencies` | 4 | package.json, configs |
| 13 | `feat(backend): add Express app factory and server bootstrap — API ready` | 3 | app.ts, main.ts |
| 12 | `feat(backend): add POST /api/v1/bonds/calculate route` | 3 | bond.routes.ts |
| 11 | `feat(backend): add bond controller to handle HTTP request/response cycle` | 3 | bond.controller.ts |
| 10 | `feat(backend): add BondService that orchestrates financial calculations` | 3 | bond.service.ts |
| 9 | `feat(backend): add express-validator rules for bond calculation input` | 3 | bond.validator.ts |
| 8 | `feat(backend): add CORS and global error handling middleware` | 3 | middleware files |
| 7 | `chore(backend): add environment config module` | 3 | config/index.ts |
| 6 | `chore(backend): scaffold backend package with dependencies and tsconfig` | 3 | package.json, tsconfig |
| 5 | `feat(shared): add package entry point and verify TypeScript compilation` | 2 | index.ts |
| 4 | `feat(shared): implement bond math utilities — YTM bisection, current yield, cash flow schedule` | 2 | bond-math.ts |
| 3 | `feat(shared): add TypeScript types for bond domain and API contracts` | 2 | types files |
| 2 | `chore(shared): scaffold shared package with package.json and tsconfig` | 2 | package.json, tsconfig |
| 1 | `docs: add project README with setup instructions and architecture overview` | 1 | README.md |
| 0b | `chore: add monorepo root package.json and base tsconfig` | 1 | package.json, tsconfig |
| 0a | `chore: initialize repo with gitignore and env example` | 1 | .gitignore, .env.example |

> **Note:** Commits 28–30 (the fix/polish commits in Phase 6) are only created if changes were actually needed during the polish pass. If the app was already correct, those commits will not exist and the total count will be lower. This is expected and normal.

---

*End of Agent Instructions. Begin implementation in the order specified in Section 16.*
