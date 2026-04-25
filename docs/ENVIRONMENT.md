# Environment

## Backend

| Variable               | Default                                      | Description                                 |
| ---------------------- | -------------------------------------------- | ------------------------------------------- |
| `PORT`                 | `3001`                                       | API server port.                            |
| `NODE_ENV`             | `development`                                | One of `development`, `test`, `production`. |
| `FRONTEND_URL`         | `http://localhost:5173`                      | CORS allowlist origin.                      |
| `LOG_LEVEL`            | `debug` in development, `info` in production | Structured logger level.                    |
| `JSON_BODY_LIMIT`      | `100kb`                                      | Express JSON and URL-encoded body limit.    |
| `RATE_LIMIT_WINDOW_MS` | `60000`                                      | Rate-limit window in milliseconds.          |
| `RATE_LIMIT_MAX`       | `120`                                        | Max requests per window.                    |

The backend validates key environment values at startup in `app/backend/src/config/index.ts`.

## Frontend

| Variable                  | Default                        | Description                                                |
| ------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `VITE_API_URL`            | `http://localhost:3001/api/v1` | API base URL compiled into the frontend bundle.            |
| `VITE_SANITY_PROJECT_ID`  | `demo`                         | Sanity project for frontend content reads, when added.     |
| `VITE_SANITY_DATASET`     | `production`                   | Sanity dataset for frontend content reads, when added.     |
| `VITE_SANITY_API_VERSION` | `2026-01-01`                   | Sanity API version for frontend content reads, when added. |

For Docker Compose, the frontend image uses:

```text
VITE_API_URL=/api/v1
```

Nginx proxies `/api` to the backend container.

## CMS

| Variable                   | Default                     | Description                                 |
| -------------------------- | --------------------------- | ------------------------------------------- |
| `SANITY_STUDIO_PROJECT_ID` | `demo`                      | Sanity project ID compiled into the Studio. |
| `SANITY_STUDIO_DATASET`    | `production`                | Dataset compiled into the Studio.           |
| `SANITY_STUDIO_HOST`       | `bond-yield-calculator-cms` | Sanity hosted Studio name for deploys.      |

The CMS lives in `app/cms` and has its own package lock. Install or build it with:

```bash
npm install --prefix app/cms
npm run cms:build
```

## Secrets

Do not commit real `.env` files. `.env.example` is documentation only.
