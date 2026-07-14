import type { Database } from 'better-sqlite3';
import { openDatabase } from './db/database.js';
import { DirectoryRepo, DocumentRepo, SettingsRepo, TagRepo } from './db/repositories.js';
import { titleFromMarkdown } from './markdown/title.js';
import { ArchiveStore } from './storage/archive.js';
import type { SyncResult } from './storage/sync.js';
import { syncArchive } from './storage/sync.js';
import type {
  Directory,
  DocumentMeta,
  DocumentWithTags,
  TreeDirectoryNode,
  TreeNode
} from './types.js';

export interface DocStoreOptions
{
  archiveDir: string;
  dbPath: string;
}

/**
 * High-level facade over the archive folder and the metadata database. The
 * server and CLI both consume this API so filesystem and DB state never
 * drift apart.
 */
export class DocStore
{
  readonly archive: ArchiveStore;
  readonly documents: DocumentRepo;
  readonly directories: DirectoryRepo;
  readonly tags: TagRepo;
  readonly settings: SettingsRepo;

  private readonly db: Database;

  constructor(options: DocStoreOptions)
  {
    this.archive = new ArchiveStore(options.archiveDir);
    this.db = openDatabase(options.dbPath);
    this.documents = new DocumentRepo(this.db);
    this.directories = new DirectoryRepo(this.db);
    this.tags = new TagRepo(this.db);
    this.settings = new SettingsRepo(this.db);
  }

  close(): void
  {
    this.db.close();
  }

  sync(): SyncResult
  {
    return syncArchive(this.documents, this.directories, this.archive);
  }

  /** Nested view of the whole archive: directories first, then documents. */
  tree(): TreeNode[]
  {
    const directories = this.directories.list();
    const documents = this.documents.listWithTags();

    const nodesById = new Map<string, TreeDirectoryNode>();
    for (const directory of directories)
    {
      nodesById.set(directory.id, { type: 'directory', directory, children: [] });
    }

    const roots: TreeNode[] = [];
    for (const directory of directories)
    {
      const node = nodesById.get(directory.id)!;
      const parent = directory.parentId ? nodesById.get(directory.parentId) : undefined;
      (parent ? parent.children : roots).push(node);
    }
    for (const document of documents)
    {
      const node: TreeNode = { type: 'document', document };
      const parent = document.directoryId ? nodesById.get(document.directoryId) : undefined;
      (parent ? parent.children : roots).push(node);
    }
    return roots;
  }

  createDirectory(name: string, parentId: string | null = null): Directory
  {
    validateName(name);
    const directory = this.directories.create(name, parentId);
    this.archive.ensureDir(this.directories.pathOf(directory.id));
    return directory;
  }

  renameDirectory(id: string, name: string): Directory
  {
    validateName(name);
    const oldPath = this.directories.pathOf(id);
    this.directories.rename(id, name);
    this.archive.moveDir(oldPath, this.directories.pathOf(id));
    this.reindexSubtree(id);
    return this.directories.get(id)!;
  }

  moveDirectory(id: string, parentId: string | null): Directory
  {
    if (parentId !== null && this.directories.subtreeIds(id).includes(parentId))
    {
      throw new Error('Cannot move a directory into itself');
    }
    const oldPath = this.directories.pathOf(id);
    this.directories.setParent(id, parentId);
    this.archive.moveDir(oldPath, this.directories.pathOf(id));
    this.reindexSubtree(id);
    return this.directories.get(id)!;
  }

  deleteDirectory(id: string): void
  {
    const subtree = this.directories.subtreeIds(id);
    for (const directoryId of subtree)
    {
      for (const document of this.documents.listByDirectory(directoryId))
      {
        this.documents.delete(document.id);
      }
    }
    this.archive.deleteDir(this.directories.pathOf(id));
    this.directories.delete(id);
  }

  uploadDocument(input: {
    filename: string;
    content: string;
    directoryId?: string | null;
  }): DocumentWithTags
  {
    const directoryId = input.directoryId ?? null;
    const filename = this.uniqueFilename(
      ensureMdExtension(sanitizeFilename(input.filename)),
      directoryId
    );
    const dirPath = directoryId ? this.directories.pathOf(directoryId) : '';
    const relPath = dirPath === '' ? filename : `${dirPath}/${filename}`;
    const size = this.archive.write(relPath, input.content);
    const document = this.documents.create({
      directoryId,
      title: titleFromMarkdown(input.content, filename),
      filename,
      relPath,
      size
    });
    return this.documents.withTags(document);
  }

  readDocument(id: string): string
  {
    const document = this.mustGetDocument(id);
    return this.archive.read(document.relPath);
  }

  renameDocument(id: string, filename: string): DocumentWithTags
  {
    const document = this.mustGetDocument(id);
    const safe = ensureMdExtension(sanitizeFilename(filename));
    const unique = this.uniqueFilename(safe, document.directoryId, id);
    const dirPath = document.directoryId ? this.directories.pathOf(document.directoryId) : '';
    const relPath = dirPath === '' ? unique : `${dirPath}/${unique}`;
    this.archive.move(document.relPath, relPath);
    this.documents.update(id, { filename: unique, relPath });
    return this.documents.withTags(this.documents.get(id)!);
  }

  moveDocument(id: string, directoryId: string | null): DocumentWithTags
  {
    const document = this.mustGetDocument(id);
    const unique = this.uniqueFilename(document.filename, directoryId, id);
    const dirPath = directoryId ? this.directories.pathOf(directoryId) : '';
    const relPath = dirPath === '' ? unique : `${dirPath}/${unique}`;
    this.archive.move(document.relPath, relPath);
    this.documents.update(id, { directoryId, filename: unique, relPath });
    return this.documents.withTags(this.documents.get(id)!);
  }

  deleteDocument(id: string): void
  {
    const document = this.mustGetDocument(id);
    this.archive.delete(document.relPath);
    this.documents.delete(id);
  }

  pruneMissing(): number
  {
    return this.documents.deleteMissing();
  }

  private mustGetDocument(id: string): DocumentMeta
  {
    const document = this.documents.get(id);
    if (!document)
    {
      throw new Error(`Document not found: ${id}`);
    }
    return document;
  }

  /** Recomputes rel_path for every document under a moved/renamed directory. */
  private reindexSubtree(directoryId: string): void
  {
    for (const subId of this.directories.subtreeIds(directoryId))
    {
      const dirPath = this.directories.pathOf(subId);
      for (const document of this.documents.listByDirectory(subId))
      {
        const relPath = dirPath === '' ? document.filename : `${dirPath}/${document.filename}`;
        if (relPath !== document.relPath)
        {
          this.documents.update(document.id, { relPath });
        }
      }
    }
  }

  /** Appends -1, -2, ... before the extension until the name is free. */
  private uniqueFilename(filename: string, directoryId: string | null, ignoreId?: string): string
  {
    const siblings = new Set(
      this.documents
        .listByDirectory(directoryId)
        .filter((document) => document.id !== ignoreId)
        .map((document) => document.filename.toLowerCase())
    );
    if (!siblings.has(filename.toLowerCase()))
    {
      return filename;
    }
    const base = filename.replace(/\.md$/i, '');
    const ext = filename.slice(base.length) || '.md';
    for (let counter = 1; ; counter++)
    {
      const candidate = `${base}-${counter}${ext}`;
      if (!siblings.has(candidate.toLowerCase()))
      {
        return candidate;
      }
    }
  }
}

function sanitizeFilename(filename: string): string
{
  const cleaned = filename
    .replaceAll('\\', '/')
    .split('/')
    .pop()!
    .replaceAll('\0', '')
    .trim();
  if (cleaned === '' || cleaned === '.' || cleaned === '..')
  {
    throw new Error(`Invalid filename: ${filename}`);
  }
  return cleaned;
}

function ensureMdExtension(filename: string): string
{
  return filename.toLowerCase().endsWith('.md') ? filename : `${filename}.md`;
}

function validateName(name: string): void
{
  if (name.trim() === '' || name.includes('/') || name.includes('\\') || name === '.' || name === '..')
  {
    throw new Error(`Invalid name: ${name}`);
  }
}
