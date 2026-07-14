FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --workspaces --include-workspace-root

COPY packages/shared packages/shared
COPY apps/web apps/web
COPY apps/admin apps/admin

RUN VITE_API_BASE_URL= npm run build -w @blog/web
RUN VITE_API_BASE_URL= npm --workspace @blog/admin run build -- --base=/admin/

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html/web
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html/admin

EXPOSE 80
