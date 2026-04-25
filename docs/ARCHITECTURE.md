# Architecture

## Overview

Bond Yield Calculator is an Nx-managed TypeScript monorepo with three npm workspace projects and one independent CMS app:

- `app/frontend`: React and Vite browser application.
- `app/backend`: Express API application.
- `libs/shared`: shared bond domain types, API types, decimal utilities, and financial math.
- `app/cms`: Sanity Studio content management application.

The core rule is simple: shared business logic lives in `shared`, backend request handling lives in `backend`, browser UI logic lives in `frontend`, and content editing lives in `cms`.

`app/cms` has its own `package-lock.json` and Dockerfile so Sanity Studio can be deployed independently and does not add Sanity's dependency tree to the frontend/backend install.

## Dependency Direction

```text
frontend -> shared
backend  -> shared
cms      -> Sanity APIs
shared   -> no app packages
```

Nx module-boundary rules enforce this direction in `eslint.config.mjs`.

## Request Flow

```text
Frontend form
  -> frontend API client
  -> POST /api/v1/bonds/calculate
  -> backend validator
  -> backend controller
  -> backend service
  -> shared bond math
  -> standardized API response
```

## Operational Flow

- `npm run ci` is the local quality gate.
- GitHub Actions runs format, lint, typecheck, test, build, and audit.
- Docker builds separate backend, frontend, and CMS images.
- Nginx serves the frontend and proxies `/api` and `/health` to the backend.
- Nginx serves the CMS static Studio from its own image.

## Non-Goals

There is no database, queue worker, or authentication layer because the current product is a stateless calculator. Add those only when product requirements demand them.
