# Boilerplate Hardening

This project borrows the useful operational ideas from larger Nx workspaces without copying cloud-specific implementation details.

## Added From The Reference Pattern

- Nx project targets for build, test, lint, typecheck, affected commands, and dependency ordering.
- Editor consistency through `.editorconfig`, Prettier, VS Code recommendations, and format checks.
- Git hooks for staged formatting and affected tests before push.
- CI workflows for full quality gates and affected-project checks.
- Docker production packaging for frontend and backend.
- App-owned Dockerfiles for frontend, backend, and CMS.
- Independent Sanity Studio app with its own lockfile and Nginx runtime image.
- `docker-compose.yml` for a local production-like stack.
- Nginx SPA serving with `/api` and `/health` proxying.
- Contribution, security, PR, and issue templates.
- Real ESLint checks with Nx module-boundary rules.
- Storybook for isolated frontend component development and review.
- Structured backend logging, request IDs, rate limiting, and body-size limits.
- Architecture, API, environment, and coding standards documentation.

## Intentionally Not Added Yet

- Cloud-provider deployment workflows. Add these only when the target is known, such as AWS ECS, Azure App Service, Render, or EC2.
- Database migration jobs. This app currently has no database.
- GraphQL code generation. The current API is REST.
- Cypress/Playwright E2E. Add once user flows stabilize beyond the current unit/component tests.
