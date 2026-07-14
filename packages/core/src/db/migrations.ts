// Ordered migrations applied via PRAGMA user_version. Never edit an entry
// after release; append a new one instead.
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE directories (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES directories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (parent_id, name)
  );

  CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    directory_id TEXT REFERENCES directories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    rel_path TEXT NOT NULL UNIQUE,
    size INTEGER NOT NULL,
    missing INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT NOT NULL
  );

  CREATE TABLE document_tags (
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `
];
