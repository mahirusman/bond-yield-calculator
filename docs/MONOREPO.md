# Monorepo Guide

This repository follows the same broad pattern as larger Nx workspaces: apps and shared code live in one Git repository, with Nx coordinating build, test, lint, dependency order, caching, and affected-project commands.

## Projects

- `libs/shared`: domain types, decimal helpers, and bond calculation logic.
- `app/backend`: Express API application.
- `app/frontend`: React and Vite application.
- `app/cms`: Sanity Studio application with its own package lock.

Both applications depend on `@bond-calculator/shared`. Keep bond math and shared request/response types in the shared package so frontend and backend behavior stays consistent.

The CMS is tracked by Nx, but it is not a root npm workspace. This keeps Sanity's dependency tree and audit surface isolated from the calculator runtime packages.

## Common Commands

```bash
npm run dev
npm run build
npm test
npm run typecheck
npm run storybook
npm run build:storybook
npm run cms:dev
npm run cms:build
npm run affected:test
npm run dep-graph
```

## Nx Practices Adopted

- Cacheable targets for `build`, `test`, `lint`, and `typecheck`.
- Shared dependency builds run before backend and frontend targets.
- Storybook runs through the frontend Nx project and builds shared code first.
- CMS commands run through Nx and delegate to the independent `app/cms` package.
- `affected:*` commands are available for faster pull request checks.
- Project tags describe ownership and intent, such as `scope:frontend`, `scope:backend`, and `scope:shared`.
- Git hooks run staged formatting before commit and affected tests before push.

## What Not To Copy Blindly

The reference workspace includes cloud-specific deployment workflows, generated GraphQL clients, Prisma, Cypress, custom zip scripts, and many environment-specific pipelines. Those are useful in a large product, but this bond calculator should only adopt them when the feature actually exists here. The first priority is a clean Nx foundation with low maintenance cost.
