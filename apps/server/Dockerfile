FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/mobile-web/package.json apps/mobile-web/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --ignore-scripts

FROM dependencies AS build

COPY apps/server apps/server
COPY packages/eslint-config packages/eslint-config
COPY packages/shared packages/shared

# Prisma generation requires valid URLs but does not connect to the database.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/kapa?schema=public
ENV DIRECT_URL=postgresql://build:build@localhost:5432/kapa?schema=public

RUN npm run build:server

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/mobile-web/package.json apps/mobile-web/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/server/prisma apps/server/prisma
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/node_modules/.prisma node_modules/.prisma

USER node

EXPOSE 4000

WORKDIR /app/apps/server

CMD ["node", "dist/index.js"]
