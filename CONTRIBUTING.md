# Contributing to doc-viewer

Thanks for your interest in improving doc-viewer. Issues and pull requests are welcome.

## Prerequisites

- Node.js >= 22
- pnpm 11 (`corepack enable` or `npm i -g pnpm`)
- Docker (only for testing the container build)
- Chromium for PDF work: `pnpm --filter @doc-viewer/core exec playwright install chromium`

## Setup and dev loop

```bash
pnpm install
pnpm dev          # core watch + API on :8090 + web on :5173
```

Before opening a PR, make sure the full check suite passes:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

PDF rendering tests are opt-in because they need a browser: `PLAYWRIGHT_TESTS=1 pnpm test`.

## Where code lives

- `packages/core`: all rendering, conversion, and storage logic. If a feature converts or stores markdown, it belongs here so both the server and the CLI get it.
- `apps/server`: thin Fastify routes over `DocStore` from core.
- `apps/web`: React UI. Theme tokens come from `@doc-viewer/core/themes`; do not define document colours anywhere else.
- `packages/cli`: thin commander commands over core.
- End-to-end tests do not exist yet; a top-level `e2e/` with Playwright Test against the compose stack is the intended home.

## Code style

- TypeScript strict mode, ESM only.
- Formatting is enforced by ESLint (not Prettier): Allman braces (opening brace on its own line), semicolons, single quotes. Run `pnpm lint:fix` to apply.
- Tests are colocated `*.test.ts(x)` files run by Vitest.

## Commit messages

Use a typed, capitalised subject and bullet-point bodies:

```
feat: Add tag filtering to the doc tree

- Filter tree nodes by selected tag
- Persist the active filter in settings
```

Types: `build`, `feat`, `fix`, `docs`, `refactor`, `test`, `ci`. Please do not use `chore`.

## Reporting issues

Include your OS, Node/pnpm or Docker versions, what you did, what you expected, and what happened. For rendering bugs, attach the markdown snippet that misbehaves.
