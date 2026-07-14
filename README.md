# doc-viewer

A local-first markdown reader with a clean web UI. Drop `.md` files anywhere in the window and read them with syntax highlighting, a directory tree, tags, and one-click export to themed HTML or PDF. Your files stay on your machine as plain markdown.

## Features

- **Drag and drop**: drop markdown files anywhere; they are stored as plain files in a deletable `archive/` folder
- **Doc tree**: organise documents into directories, rename and move them from the UI
- **Tags**: create coloured tags in Settings and apply them to any document
- **Dark / light themes**: switch in Settings, follow the OS, and get identical rendering in the app and in exports
- **Export**: convert any document to a self-contained HTML file or a PDF (rendered with Chromium), in either theme
- **CLI**: convert files and manage the archive without the UI
- **Local-first**: no accounts, no cloud, one SQLite file for metadata

## Quick start (Docker)

```bash
docker compose up --build
```

Open http://localhost:8090. Dropped files appear in `./archive` on the host. To change the published port or make archive files belong to your user (set `DOC_VIEWER_UID`/`DOC_VIEWER_GID` to your `id -u` / `id -g`), copy `.env.example` to `.env` and adjust it.

Note: the image is large (~2 GB) because it bundles Chromium for PDF export.

## Local development

Requirements: Node >= 22 and pnpm 11 (`corepack enable`).

```bash
pnpm install
pnpm dev          # core watch + API on :8090 + web UI on :5173
```

Open http://localhost:5173. Other useful commands:

```bash
pnpm test         # run all test suites
pnpm lint         # ESLint (also enforces formatting)
pnpm typecheck    # TypeScript across all packages
pnpm build        # build every package
```

PDF export needs a local Chromium once: `pnpm --filter @doc-viewer/core exec playwright install chromium`.

There is also a containerised dev environment: `docker compose --profile dev up dev` (UI on :5173).

## CLI

```bash
doc-viewer convert README.md --to pdf --theme dark -o out/
doc-viewer convert docs/*.md --to html
doc-viewer list --archive ./archive
doc-viewer sync --archive ./archive --data ./data
```

Inside the repo, run it as `node packages/cli/dist/index.js` after `pnpm build`. See [docs/cli.md](docs/cli.md) for the full reference.

## How it works

A pnpm monorepo with a shared core so the web UI and the CLI convert files identically:

| Package | Purpose |
| ------- | ------- |
| `packages/core` | Markdown rendering (unified + shiki), theme tokens, HTML/PDF export, archive storage, SQLite metadata |
| `apps/server` | Fastify API and static host for the web UI |
| `apps/web` | React UI (Vite, TanStack Query, framer-motion) |
| `packages/cli` | commander CLI wrapping core |

More detail in [docs/architecture.md](docs/architecture.md) and [docs/usage.md](docs/usage.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
