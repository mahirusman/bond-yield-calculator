FROM node:20.19-alpine AS build

WORKDIR /app

COPY package.json package-lock.json nx.json tsconfig.base.json ./
COPY libs/shared/package.json libs/shared/package.json
COPY app/backend/package.json app/backend/package.json
COPY app/frontend/package.json app/frontend/package.json

RUN npm pkg delete scripts.prepare
RUN npm ci --workspace=libs/shared --workspace=app/backend

COPY app app
COPY libs libs

RUN npm run build --workspace=libs/shared
RUN npm run build --workspace=app/backend
RUN npm prune --omit=dev

FROM node:20.19-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/libs/shared/package.json libs/shared/package.json
COPY --from=build /app/libs/shared/dist libs/shared/dist
COPY --from=build /app/app/backend/package.json app/backend/package.json
COPY --from=build /app/app/backend/dist app/backend/dist

EXPOSE 3001

CMD ["node", "app/backend/dist/main.js"]
