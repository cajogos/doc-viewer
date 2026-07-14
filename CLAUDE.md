# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

doc-viewer: a local-first markdown reader. pnpm monorepo, TypeScript, ESM everywhere.

- `packages/core` (`@doc-viewer/core`): markdown rendering (unified + remark-gfm + rehype-sanitize + shiki dual themes), theme tokens, standalone HTML template, PDF via Playwright, `ArchiveStore` (files on disk), SQLite repositories, and the `DocStore` facade that combines them.
- `apps/server`: Fastify API over `DocStore` plus static hosting of the built web UI. Defaults: HOST=0.0.0.0, PORT=8090.
- `apps/web`: React + Vite UI (TanStack Query, react-router, framer-motion).
- `packages/cli`: commander CLI (`doc-viewer convert|list|sync`) wrapping core.

## Commands

```bash
pnpm dev          # core tsc watch + server (tsx) on :8090 + vite on :5173
pnpm build        # topological build of all packages
pnpm test         # vitest projects: core, server, web
pnpm lint         # eslint (also the formatter; no Prettier for TS)
pnpm typecheck    # tsc --noEmit in every package
PLAYWRIGHT_TESTS=1 pnpm test            # includes the PDF smoke test
docker compose up --build               # production container on :8090
docker compose --profile dev up dev     # hot-reload container on :5173
```

## Architecture rules

- All conversion and storage logic lives in `packages/core`. The server and CLI stay thin; if you write markdown/file/DB logic in a route or command, move it to core.
- Theme CSS exists in exactly one place: `packages/core/src/export/themes.ts`. The web app injects it, exports inline it. Never duplicate document colours elsewhere.
- The web app may only import `@doc-viewer/core/themes` (browser-safe subpath) at runtime; type-only imports from `@doc-viewer/core` are fine.
- The archive folder mirrors the doc tree on disk and must stay safe to delete: any DB write that references a file goes through `DocStore` so disk and DB never drift.
- Server rendering (`?include=html`) is intentional: the viewer shows exactly what exports produce.

## Code style

- Allman braces (opening brace on its own line), semicolons, single quotes. Enforced via ESLint `@stylistic`; run `pnpm lint:fix`.
- Commit messages: `type: Capitalised subject` with bullet-point bodies. Allowed types: build, feat, fix, docs, refactor, test, ci. Never `chore`, never `Co-Authored-By` lines.
- No em dash characters anywhere (code, comments, docs); use a hyphen, comma, or colon.

## Gotchas

- pnpm blocks postinstall scripts: `allowBuilds` in `pnpm-workspace.yaml` must list better-sqlite3 and esbuild or the native binding silently breaks.
- The `playwright` npm version in `packages/core/package.json` is pinned exactly and must match the Docker base image tag (`mcr.microsoft.com/playwright:vX.Y.Z-noble`). Bump both together.
- `packages/core` must be built (`pnpm --filter @doc-viewer/core build`) before the server can typecheck or run, since its `exports` point at `dist/`. Tests and Vite alias core to `src/` and do not need a build.
- PDF tests need a local Chromium and are skipped unless `PLAYWRIGHT_TESTS=1`.
