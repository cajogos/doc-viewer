import type { DirectoryRepo, DocumentRepo } from '../db/repositories.js';
import { titleFromMarkdown } from '../markdown/title.js';
import type { ArchiveStore } from './archive.js';

export interface SyncResult
{
  added: number;
  restored: number;
  markedMissing: number;
}

/**
 * Reconciles the archive folder with the database:
 * - files on disk without a row are inserted (directory rows created from
 *   their path segments)
 * - rows whose file vanished are flagged missing
 * - flagged rows whose file reappeared are restored
 */
export function syncArchive(
  documents: DocumentRepo,
  directories: DirectoryRepo,
  archive: ArchiveStore
): SyncResult
{
  const result: SyncResult = { added: 0, restored: 0, markedMissing: 0 };
  const onDisk = new Set(archive.scan());

  for (const relPath of onDisk)
  {
    const existing = documents.getByRelPath(relPath);
    if (existing)
    {
      if (existing.missing)
      {
        documents.update(existing.id, { missing: false, size: archive.size(relPath) });
        result.restored++;
      }
      continue;
    }
    const segments = relPath.split('/');
    const filename = segments.pop()!;
    const directory = directories.ensurePath(segments);
    const content = archive.read(relPath);
    documents.create({
      directoryId: directory?.id ?? null,
      title: titleFromMarkdown(content, filename),
      filename,
      relPath,
      size: archive.size(relPath)
    });
    result.added++;
  }

  for (const document of documents.list())
  {
    if (!document.missing && !onDisk.has(document.relPath))
    {
      documents.update(document.id, { missing: true });
      result.markedMissing++;
    }
  }

  return result;
}
