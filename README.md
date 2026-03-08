# Bond Yield Calculator

A full-stack monorepo that calculates core fixed-income metrics for plain-vanilla bonds:

- Current Yield
- Yield to Maturity (YTM)
- Total Interest Earned
- Premium/Discount status
- Full cash flow schedule by period

![Bond Yield Calculator Screenshot Placeholder](https://via.placeholder.com/1280x720?text=Bond+Yield+Calculator+Screenshot)

## Architecture

This project uses npm workspaces in a monorepo:

- `packages/shared`: shared bond domain types and financial calculation logic
- `packages/backend`: Express API (TypeScript)
- `packages/frontend`: React + Vite UI (TypeScript)

Calculation logic is centralized in the shared package to avoid duplication and keep backend/frontend behavior consistent.

Production deployment steps for the EC2 setup are documented in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites

- Node.js >= 18
- npm >= 9

## Setup

1. Clone repository

```bash
git clone <your-repo-url>
cd bond-yield-calculator
```

2. Install dependencies

```bash
npm install
```

3. Configure environment

```bash
cp .env.example packages/backend/.env
```

4. Run full stack in development

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Development Commands

```bash
# Start frontend + backend together
npm run dev

# Start only backend
npm run dev --workspace=packages/backend

# Start only frontend
npm run dev --workspace=packages/frontend

# Build all packages
npm run build

# Run all tests
npm test

# Run only shared unit tests
npm test --workspace=packages/shared
```

## API Documentation

### POST `/api/v1/bonds/calculate`

Request body:

```json
{
  "faceValue": 1000,
  "annualCouponRate": 6,
  "marketPrice": 950,
  "yearsToMaturity": 5,
  "couponFrequency": "semi-annual"
}
```

Success response (`200`):

```json
{
  "success": true,
  "data": {
    "currentYield": 0.06315789473684211,
    "ytm": 0.07208746671676636,
    "totalInterest": 300,
    "premiumDiscount": {
      "status": "discount",
      "difference": 50
    },
    "cashFlowSchedule": [
      {
        "period": 1,
        "paymentDate": "2026-08-23",
        "couponPayment": 30,
        "cumulativeInterest": 30,
        "remainingPrincipal": 1000,
        "isFinal": false
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

Validation error response (`400`):

```json
{
  "success": false,
  "errors": [
    {
      "msg": "Face value must be a positive number",
      "path": "faceValue"
    }
  ]
}
```

General error response (`500`):

```json
{
  "success": false,
  "error": {
    "message": "Internal server error"
  }
}
```

### Health Check

- `GET /health`

## Financial Concepts

- Current Yield: annual coupon payment divided by current market price.
- Yield to Maturity (YTM): annualized return when holding the bond to maturity, solved numerically using bisection.
- Premium/Discount:
  - Premium: market price > face value
  - Discount: market price < face value
  - Par: market price == face value
- Cash Flow Schedule: period-by-period coupon payments, cumulative interest, and remaining principal.

## Project Structure

```text
bond-yield-calculator/
├── .env.example
├── .gitignore
├── README.md
├── package-lock.json
├── package.json
├── tsconfig.base.json
└── packages/
    ├── .gitkeep
    ├── backend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── app.ts
    │       ├── main.ts
    │       ├── config/
    │       │   └── index.ts
    │       ├── controllers/
    │       │   └── bond.controller.ts
    │       ├── middleware/
    │       │   ├── cors.middleware.ts
    │       │   └── error.middleware.ts
    │       ├── routes/
    │       │   └── bond.routes.ts
    │       ├── services/
    │       │   └── bond.service.ts
    │       └── validators/
    │           └── bond.validator.ts
    ├── frontend/
    │   ├── index.html
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vite.config.ts
    │   └── src/
    │       ├── App.tsx
    │       ├── main.tsx
    │       ├── api/
    │       │   └── bond.api.ts
    │       ├── components/
    │       │   ├── BondForm/
    │       │   │   ├── BondForm.module.css
    │       │   │   └── BondForm.tsx
    │       │   ├── CashFlowTable/
    │       │   │   ├── CashFlowTable.module.css
    │       │   │   └── CashFlowTable.tsx
    │       │   ├── MetricCard/
    │       │   │   ├── MetricCard.module.css
    │       │   │   └── MetricCard.tsx
    │       │   ├── ResultsPanel/
    │       │   │   ├── ResultsPanel.module.css
    │       │   │   └── ResultsPanel.tsx
    │       │   └── common/
    │       │       ├── ErrorBanner.tsx
    │       │       └── Loader.tsx
    │       ├── hooks/
    │       │   └── useBondCalculator.ts
    │       ├── styles/
    │       │   └── global.css
    │       └── types/
    │           └── index.ts
    └── shared/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── __tests__/
            │   └── bond-math.test.ts
            ├── types/
            │   ├── api.types.ts
            │   └── bond.types.ts
            └── utils/
                └── bond-math.ts
```

## Running Tests

```bash
# Run all workspace tests
npm test

# Run shared package financial unit tests only
npm test --workspace=packages/shared
```
