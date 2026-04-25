# Bond Yield Calculator

A full-stack monorepo that calculates core fixed-income metrics for plain-vanilla bonds:

- Current Yield
- Yield to Maturity (YTM)
- Total Interest Earned
- Premium/Discount status
- Full cash flow schedule by period

![Bond Yield Calculator Screenshot](./docs/bond-yield-calculator-live.png)

## Live Demo

- Frontend: `https://16.25.121.8`
- Backend: `https://16.25.121.8/api/v1`
- Health Check: `https://16.25.121.8/health`

## Architecture

This project uses Nx with npm workspaces in a monorepo:

- `libs/shared`: shared bond domain types and financial calculation logic
- `app/backend`: Express API (TypeScript)
- `app/frontend`: React + Vite UI (TypeScript)
- `app/cms`: independent Sanity Studio app for editable content

Calculation logic is centralized in the shared package to avoid duplication and keep backend/frontend behavior consistent.

The root npm workspaces are intentionally limited to `app/backend`, `app/frontend`, and `libs/shared`. The CMS is kept as an independent app with its own `package-lock.json` so Sanity dependencies do not pollute the main frontend/backend install or audit surface.

Financial calculations use decimal-safe arithmetic with `decimal.js`. Numeric inputs are preserved as decimal strings at the API boundary, and backend outputs are returned as decimal strings so binary floating-point error does not leak into production calculations.

Production deployment steps for the EC2 setup are documented in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites

- Node.js >= 20.19
- npm >= 11
- Docker Desktop for Docker-based local runs

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

Install CMS dependencies only when you want to run or build Sanity Studio:

```bash
npm install --prefix app/cms
```

3. Configure environment

```bash
cp .env.example app/backend/.env
```

4. Run full stack in development

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- CMS, when started separately: `http://localhost:3333`

## Development Commands

```bash
# Start frontend + backend together
npm run dev

# Start only backend
npm run dev --workspace=app/backend

# Start only frontend
npm run dev --workspace=app/frontend

# Build all packages
npm run build

# Run all tests
npm test

# Run only shared unit tests
npm test --workspace=libs/shared

# Run the full local quality gate
npm run ci

# Open the frontend component workshop
npm run storybook

# Build the static Storybook site
npm run build:storybook

# Run Sanity Studio locally
npm run cms:dev

# Build Sanity Studio
npm run cms:build

# Start the production-like Docker stack
npm run docker:up

# Run individual Docker services
npm run docker:api
npm run docker:web
npm run docker:cms
```

### Script Reference

| Command                   | What it does                                                 |
| ------------------------- | ------------------------------------------------------------ |
| `npm run dev`             | Starts backend and frontend dev targets together with Nx.    |
| `npm run build`           | Builds `libs/shared`, then backend and frontend.             |
| `npm test`                | Runs all workspace tests through Nx.                         |
| `npm run lint`            | Runs ESLint for all configured projects.                     |
| `npm run typecheck`       | Runs TypeScript type checking for all configured projects.   |
| `npm run affected:build`  | Builds only projects affected by current changes.            |
| `npm run affected:test`   | Tests only projects affected by current changes.             |
| `npm run affected:lint`   | Lints only projects affected by current changes.             |
| `npm run dep-graph`       | Opens the Nx dependency graph.                               |
| `npm run storybook`       | Starts frontend Storybook.                                   |
| `npm run build:storybook` | Builds static Storybook output.                              |
| `npm run cms:dev`         | Starts the independent Sanity Studio app.                    |
| `npm run cms:build`       | Builds Sanity Studio static output.                          |
| `npm run ci`              | Runs format check, lint, typecheck, tests, build, and audit. |
| `npm run docker:build`    | Builds all Docker images.                                    |
| `npm run docker:up`       | Starts the full Docker stack.                                |
| `npm run docker:api`      | Starts only the backend Docker service.                      |
| `npm run docker:web`      | Starts only the frontend Docker service.                     |
| `npm run docker:cms`      | Starts only the CMS Docker service.                          |

Docker service URLs:

- Frontend container: `http://localhost:8080`
- Backend container: `http://localhost:3001`
- CMS container: `http://localhost:3333`

The frontend and backend Dockerfiles live inside their apps:

- `app/frontend/Dockerfile`
- `app/frontend/nginx.conf`
- `app/backend/Dockerfile`
- `app/cms/Dockerfile`
- `app/cms/nginx.conf`

## Boilerplate Tooling

This repository includes Nx project orchestration, affected-project commands, Storybook for frontend component review, a separate Sanity CMS app, ESLint, Prettier, Husky hooks, CI workflows, Docker production packaging, structured backend logging, rate limiting, request IDs, and contribution/security templates.

Useful docs:

- [Monorepo Guide](./docs/MONOREPO.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Environment](./docs/ENVIRONMENT.md)
- [Coding Standards](./docs/CODING_STANDARDS.md)
- [Boilerplate Hardening](./docs/BOILERPLATE_HARDENING.md)

## Financial Concepts

- Current Yield: annual coupon payment divided by current market price.
- Yield to Maturity (YTM): annualized return when holding the bond to maturity, solved numerically using bisection.
- Precision model: money and yield calculations are performed with decimal arithmetic instead of raw JavaScript floating-point math.
- Premium/Discount:
  - Premium: market price > face value
  - Discount: market price < face value
  - Par: market price == face value
- Cash Flow Schedule: period-by-period coupon payments, cumulative interest, and remaining principal.

## Running Tests

```bash
# Run all workspace tests
npm test

# Run shared package financial unit tests only
npm test --workspace=libs/shared

# Run backend API integration tests only
npm test --workspace=app/backend

# Run frontend component and hook tests only
npm test --workspace=app/frontend
```

## Test Coverage

The repository includes implemented automated test coverage across all workspaces:

- `libs/shared`: financial math unit tests for current yield, YTM, total interest, premium/discount logic, and cash flow schedule generation
- `app/backend`: Express API integration tests for success cases, validation failures, health checks, and error response shape
- `app/frontend`: React component and hook tests for form behavior, results rendering, cash flow table output, and calculation state management
- Test case source of truth: [TEST_INSTRUCTIONS.md](./TEST_INSTRUCTIONS.md)
- Pull request automation workflow: [.github/workflows/ci.yml](./.github/workflows/ci.yml)

The current workspace test suite runs through the root command:

```bash
npm test
```

Pull requests to `main` also run the automated checks in GitHub Actions through:

- `.github/workflows/ci.yml`
- `TEST_INSTRUCTIONS.md` defines the intended test scope and should be updated when functionality changes affect test expectations

That workflow executes:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```
