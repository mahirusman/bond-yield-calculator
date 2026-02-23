# Bond Yield Calculator

A full-stack monorepo application for calculating bond metrics, including current yield, yield to maturity (YTM), total interest, premium/discount status, and a detailed cash flow schedule.

## Screenshot

Screenshot placeholder: add UI screenshot after frontend implementation.

## Architecture Overview

This repository uses an npm workspaces monorepo:

- `packages/shared`: shared financial logic and TypeScript types
- `packages/backend`: Node.js + Express REST API
- `packages/frontend`: React + Vite web app

## Prerequisites

- Node.js >= 18
- npm >= 9

## Setup Instructions

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run backend and frontend together:
   ```bash
   npm run dev
   ```

## Development Commands

```bash
npm run dev
npm run build
npm test
npm run dev --workspace=packages/backend
npm run dev --workspace=packages/frontend
```

## API Documentation

Placeholder: API endpoint docs will be finalized once backend implementation is complete.

## Financial Concepts

Placeholder: Current Yield, YTM, premium/discount, and cash flow schedule definitions will be finalized later.

## Project Structure

```text
bond-yield-calculator/
├── package.json
├── tsconfig.base.json
└── packages/
    ├── shared/    # TODO
    ├── backend/   # TODO
    └── frontend/  # TODO
```

## Running Tests

Placeholder: test commands will be finalized once Jest test setup is complete.
