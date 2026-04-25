FROM node:20.19-alpine AS build

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app

COPY package.json package-lock.json nx.json tsconfig.base.json ./
COPY libs/shared/package.json libs/shared/package.json
COPY app/backend/package.json app/backend/package.json
COPY app/frontend/package.json app/frontend/package.json

RUN npm pkg delete scripts.prepare
RUN npm ci --workspace=libs/shared --workspace=app/frontend

COPY app app
COPY libs libs

RUN npm run build --workspace=libs/shared
RUN npm run build --workspace=app/frontend

FROM nginx:1.27-alpine AS runtime

COPY app/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/app/frontend/dist /usr/share/nginx/html

EXPOSE 80
