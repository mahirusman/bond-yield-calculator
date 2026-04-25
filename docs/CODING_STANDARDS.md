# Coding Standards

## Commands

Run the full local gate before opening a pull request:

```bash
npm run ci
```

## Monorepo Boundaries

- Frontend can depend on `@bond-calculator/shared`.
- Backend can depend on `@bond-calculator/shared`.
- Shared must not depend on frontend or backend.

These boundaries are enforced by ESLint and Nx.

## TypeScript

- Keep `strict` mode enabled.
- Avoid `any`; use `unknown`, typed response contracts, or explicit interfaces.
- Keep business types in `libs/shared/src/types`.

## Backend

- Controllers should parse request state and return standardized responses.
- Services should contain business/application logic.
- Shared financial calculations should stay in `libs/shared`.
- Use `logger` instead of `console`.
- Use response helpers from `backend/src/utils/response.ts`.

## Frontend

- API calls belong in `frontend/src/api`.
- Async UI state belongs in hooks where practical.
- Reusable UI belongs in `frontend/src/components`.
- Form validation should stay close to the form unless it must be shared with the backend.

## Formatting

Prettier is the source of truth for formatting.
