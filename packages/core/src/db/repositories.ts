import { randomUUID } from 'node:crypto';
import type { Database } from 'better-sqlite3';
import type { Directory, DocumentMeta, DocumentWithTags, Settings, Tag } from '../types.js';
import { DEFAULT_SETTINGS } from '../types.js';

interface DirectoryRow
{
  id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
}

interface DocumentRow
{
  id: string;
  directory_id: string | null;
  title: string;
  filename: string;
  rel_path: string;
  size: number;
  missing: number;
  created_at: string;
  updated_at: string;
}

function toDirectory(row: DirectoryRow): Directory
{
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    createdAt: row.created_at
  };
}

function toDocument(row: DocumentRow): DocumentMeta
{
  return {
    id: row.id,
    directoryId: row.directory_id,
    title: row.title,
    filename: row.filename,
    relPath: row.rel_path,
    size: row.size,
    missing: row.missing === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class DirectoryRepo
{
  constructor(private readonly db: Database) {}

  create(name: string, parentId: string | null = null): Directory
  {
    const id = randomUUID();
    this.db
      .prepare('INSERT INTO directories (id, parent_id, name) VALUES (?, ?, ?)')
      .run(id, parentId, name);
    return this.get(id)!;
  }

  get(id: string): Directory | null
  {
    const row = this.db
      .prepare('SELECT * FROM directories WHERE id = ?')
      .get(id) as DirectoryRow | undefined;
    return row ? toDirectory(row) : null;
  }

  list(): Directory[]
  {
    const rows = this.db
      .prepare('SELECT * FROM directories ORDER BY name COLLATE NOCASE')
      .all() as DirectoryRow[];
    return rows.map(toDirectory);
  }

  findChild(parentId: string | null, name: string): Directory | null
  {
    const row = (parentId === null
      ? this.db
        .prepare('SELECT * FROM directories WHERE parent_id IS NULL AND name = ? COLLATE NOCASE')
        .get(name)
      : this.db
        .prepare('SELECT * FROM directories WHERE parent_id = ? AND name = ? COLLATE NOCASE')
        .get(parentId, name)) as DirectoryRow | undefined;
    return row ? toDirectory(row) : null;
  }

  rename(id: string, name: string): void
  {
    this.db.prepare('UPDATE directories SET name = ? WHERE id = ?').run(name, id);
  }

  setParent(id: string, parentId: string | null): void
  {
    this.db.prepare('UPDATE directories SET parent_id = ? WHERE id = ?').run(parentId, id);
  }

  delete(id: string): void
  {
    this.db.prepare('DELETE FROM directories WHERE id = ?').run(id);
  }

  /** Relative path of a directory built from its ancestor chain. */
  pathOf(id: string): string
  {
    const segments: string[] = [];
    let current = this.get(id);
    while (current)
    {
      segments.unshift(current.name);
      current = current.parentId ? this.get(current.parentId) : null;
    }
    return segments.join('/');
  }

  /** Finds or creates the directory chain for the given path segments. */
  ensurePath(segments: string[]): Directory | null
  {
    let parent: Directory | null = null;
    let parentId: string | null = null;
    for (const segment of segments)
    {
      const existing = this.findChild(parentId, segment);
      parent = existing ?? this.create(segment, parentId);
      parentId = parent.id;
    }
    return parent;
  }

  /** IDs of the directory and every descendant directory. */
  subtreeIds(id: string): string[]
  {
    const ids = [id];
    const rows = this.db
      .prepare('SELECT id FROM directories WHERE parent_id = ?');
    const walk = (parentId: string): void =>
    {
      for (const row of rows.all(parentId) as Array<{ id: string }>)
      {
        ids.push(row.id);
        walk(row.id);
      }
    };
    walk(id);
    return ids;
  }
}

export class DocumentRepo
{
  constructor(private readonly db: Database) {}

  create(input: {
    directoryId: string | null;
    title: string;
    filename: string;
    relPath: string;
    size: number;
  }): DocumentMeta
  {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO documents (id, directory_id, title, filename, rel_path, size)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.directoryId, input.title, input.filename, input.relPath, input.size);
    return this.get(id)!;
  }

  get(id: string): DocumentMeta | null
  {
    const row = this.db
      .prepare('SELECT * FROM documents WHERE id = ?')
      .get(id) as DocumentRow | undefined;
    return row ? toDocument(row) : null;
  }

  getByRelPath(relPath: string): DocumentMeta | null
  {
    const row = this.db
      .prepare('SELECT * FROM documents WHERE rel_path = ?')
      .get(relPath) as DocumentRow | undefined;
    return row ? toDocument(row) : null;
  }

  list(): DocumentMeta[]
  {
    const rows = this.db
      .prepare('SELECT * FROM documents ORDER BY filename COLLATE NOCASE')
      .all() as DocumentRow[];
    return rows.map(toDocument);
  }

  listByDirectory(directoryId: string | null): DocumentMeta[]
  {
    const rows = (directoryId === null
      ? this.db.prepare('SELECT * FROM documents WHERE directory_id IS NULL').all()
      : this.db.prepare('SELECT * FROM documents WHERE directory_id = ?').all(directoryId)) as DocumentRow[];
    return rows.map(toDocument);
  }

  update(
    id: string,
    fields: Partial<Pick<DocumentMeta, 'directoryId' | 'title' | 'filename' | 'relPath' | 'size' | 'missing'>>
  ): void
  {
    const sets: string[] = [];
    const values: unknown[] = [];
    const columns: Record<string, string> = {
      directoryId: 'directory_id',
      title: 'title',
      filename: 'filename',
      relPath: 'rel_path',
      size: 'size',
      missing: 'missing'
    };
    for (const [key, column] of Object.entries(columns))
    {
      if (key in fields)
      {
        sets.push(`${column} = ?`);
        const value = fields[key as keyof typeof fields];
        values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
      }
    }
    if (sets.length === 0)
    {
      return;
    }
    sets.push("updated_at = datetime('now')");
    this.db
      .prepare(`UPDATE documents SET ${sets.join(', ')} WHERE id = ?`)
      .run(...values, id);
  }

  delete(id: string): void
  {
    this.db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  }

  deleteMissing(): number
  {
    const result = this.db.prepare('DELETE FROM documents WHERE missing = 1').run();
    return result.changes;
  }

  setTags(documentId: string, tagIds: string[]): void
  {
    const apply = this.db.transaction(() =>
    {
      this.db.prepare('DELETE FROM document_tags WHERE document_id = ?').run(documentId);
      const insert = this.db
        .prepare('INSERT INTO document_tags (document_id, tag_id) VALUES (?, ?)');
      for (const tagId of tagIds)
      {
        insert.run(documentId, tagId);
      }
    });
    apply();
  }

  tagsOf(documentId: string): Tag[]
  {
    return this.db
      .prepare(
        `SELECT t.* FROM tags t
         JOIN document_tags dt ON dt.tag_id = t.id
         WHERE dt.document_id = ?
         ORDER BY t.name COLLATE NOCASE`
      )
      .all(documentId) as Tag[];
  }

  withTags(document: DocumentMeta): DocumentWithTags
  {
    return { ...document, tags: this.tagsOf(document.id) };
  }

  listWithTags(): DocumentWithTags[]
  {
    return this.list().map((document) => this.withTags(document));
  }
}

export class TagRepo
{
  constructor(private readonly db: Database) {}

  create(name: string, color: string): Tag
  {
    const id = randomUUID();
    this.db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)').run(id, name, color);
    return this.get(id)!;
  }

  get(id: string): Tag | null
  {
    const row = this.db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | undefined;
    return row ?? null;
  }

  list(): Tag[]
  {
    return this.db.prepare('SELECT * FROM tags ORDER BY name COLLATE NOCASE').all() as Tag[];
  }

  update(id: string, fields: Partial<Pick<Tag, 'name' | 'color'>>): void
  {
    const sets: string[] = [];
    const values: unknown[] = [];
    if (fields.name !== undefined)
    {
      sets.push('name = ?');
      values.push(fields.name);
    }
    if (fields.color !== undefined)
    {
      sets.push('color = ?');
      values.push(fields.color);
    }
    if (sets.length === 0)
    {
      return;
    }
    this.db.prepare(`UPDATE tags SET ${sets.join(', ')} WHERE id = ?`).run(...values, id);
  }

  delete(id: string): void
  {
    this.db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  }
}

export class SettingsRepo
{
  constructor(private readonly db: Database) {}

  getAll(): Settings
  {
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as Array<{
      key: string;
      value: string;
    }>;
    const stored = Object.fromEntries(rows.map((row) => [row.key, JSON.parse(row.value) as unknown]));
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  put(settings: Partial<Settings>): Settings
  {
    const upsert = this.db.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    );
    const apply = this.db.transaction(() =>
    {
      for (const [key, value] of Object.entries(settings))
      {
        upsert.run(key, JSON.stringify(value));
      }
    });
    apply();
    return this.getAll();
  }
}
