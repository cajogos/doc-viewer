# The Playwright image tag must match the playwright version pinned in
# packages/core/package.json, or Chromium will not be found at runtime.
FROM mcr.microsoft.com/playwright:v1.61.1-noble AS base
RUN npm install -g pnpm@11.2.2
WORKDIR /app

FROM base AS build
# Toolchain insurance for better-sqlite3 when no prebuilt binary matches.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/cli/package.json packages/cli/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm -r build
RUN pnpm --filter @doc-viewer/server deploy --legacy --prod /out

# Hot-reload development environment used by the compose "dev" profile.
FROM base AS dev
ENV HOST=0.0.0.0 PORT=8090
EXPOSE 5173 8090
CMD ["sh", "-c", "pnpm install && pnpm dev"]

FROM base AS runtime
ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=8090 \
  ARCHIVE_DIR=/app/archive \
  DATA_DIR=/app/data \
  WEB_DIST=/app/web-dist
COPY --from=build /out /app
COPY --from=build /app/apps/web/dist /app/web-dist
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8090
# The entrypoint chowns the mounted archive/data dirs to DOC_VIEWER_UID:GID
# (default 1000:1000) and drops root, so archive files belong to the host user.
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/index.js"]
