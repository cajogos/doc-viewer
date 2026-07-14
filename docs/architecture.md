# Architecture

doc-viewer is a pnpm workspace monorepo. One shared core package owns every rule about how markdown becomes HTML, PDF, files, and database rows; the server, web UI, and CLI are thin shells around it.

```
packages/core      @doc-viewer/core   rendering, themes, export, storage
packages/cli       @doc-viewer/cli    commander CLI over core
apps/server        @doc-viewer/server Fastify API + static host
apps/web           @doc-viewer/web    React UI
```

## Data flow

```
drop .md file
  └─> POST /api/documents (multipart)
        └─> DocStore.uploadDocument
              ├─> ArchiveStore.write  -> archive/<dir>/<file>.md   (plain file)
              └─> DocumentRepo.create -> SQLite row (id, title, rel_path, ...)

open a document
  └─> GET /api/documents/:id?include=html
        └─> renderMarkdown (unified: remark-parse -> gfm -> rehype -> sanitize -> shiki -> stringify)
              └─> viewer injects the same THEME_CSS the exports use

export
  └─> GET /api/documents/:id/export?format=pdf&theme=dark
        └─> renderMarkdown -> renderStandaloneHtml (CSS inlined) -> htmlToPdf (Chromium)
```

## The archive folder

`archive/` mirrors the doc tree: directories are real directories, documents are real `.md` files. The folder is the user's property; it can be edited or deleted outside the app at any time. `syncArchive` reconciles it with the database:

- file on disk with no row: a row is created (directory rows derived from path segments, title from the first h1)
- row whose file vanished: flagged `missing` and greyed out in the UI (Settings -> General can prune)
- flagged row whose file returned: restored

Sync runs at server startup, via `POST /api/sync`, from Settings -> General, and via `doc-viewer sync`.

## Metadata database

SQLite via better-sqlite3, stored in the data directory (a named volume in Docker). Migrations are ordered SQL strings applied through `PRAGMA user_version`. Schema:

```
directories    id, parent_id (FK, cascade), name, created_at, UNIQUE(parent_id, name)
documents      id, directory_id (FK, set null), title, filename, rel_path (UNIQUE),
               size, missing, created_at, updated_at
tags           id, name (UNIQUE, case-insensitive), color
document_tags  document_id + tag_id (composite PK, cascades both ways)
settings       key, value (JSON)
```

## Theming

`packages/core/src/export/themes.ts` is the single source of truth: CSS custom properties per `[data-theme]` plus document typography. The web app injects the constant into a `<style>` tag; `renderStandaloneHtml` inlines it into exports; PDFs are printed from that same HTML. Code highlighting uses shiki's dual-theme output (light colours inline, dark via `--shiki-dark` variables), so one rendered HTML answers both themes without re-rendering.

## Server

Fastify 5. `buildApp({ archiveDir, dbPath, webDistDir })` is a factory used by both `index.ts` and the tests (through `app.inject`, no sockets). Errors thrown by core map to HTTP: "not found" -> 404, validation -> 400, SQLite UNIQUE -> 409. In production the server also serves the built web UI with an SPA fallback. Configuration is environment-driven: `HOST` (default 0.0.0.0), `PORT` (default 8090), `ARCHIVE_DIR`, `DATA_DIR`, `WEB_DIST`.

## Testing

Vitest projects (`core`, `server` in node; `web` in jsdom). Core carries most coverage: rendering pipeline, sanitisation, archive path-traversal guards, repositories against in-memory SQLite, sync scenarios. Server tests exercise routes through `app.inject`. Web tests cover theme switching, sidebar collapse, and tag management with a stubbed fetch. The PDF path has a smoke test gated behind `PLAYWRIGHT_TESTS=1`.
