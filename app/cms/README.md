# Bond Yield Calculator CMS

Sanity Studio runs as an independent Nx app and Docker service.

## Commands

```bash
npm run cms:dev
npm run cms:build
npm run cms:start
npm run cms:deploy
```

## Environment

```bash
SANITY_STUDIO_PROJECT_ID=your_project_id
SANITY_STUDIO_DATASET=production
SANITY_STUDIO_HOST=bond-yield-calculator-cms
```

The Docker image builds the static Studio and serves it with Nginx on port `80`.
