import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { dirname, isAbsolute, join, normalize, resolve, sep } from 'node:path';

/**
 * Filesystem home of the raw markdown files. The folder mirrors the doc tree
 * (directories are real directories) and is safe for the user to delete:
 * syncArchive reconciles the database afterwards.
 */
export class ArchiveStore
{
  readonly rootDir: string;

  constructor(rootDir: string)
  {
    this.rootDir = resolve(rootDir);
    mkdirSync(this.rootDir, { recursive: true });
  }

  /** Resolves a relative path inside the archive, rejecting traversal attempts. */
  resolve(relPath: string): string
  {
    if (isAbsolute(relPath))
    {
      throw new Error(`Archive paths must be relative: ${relPath}`);
    }
    const normalized = normalize(relPath);
    if (normalized === '..' || normalized.startsWith(`..${sep}`))
    {
      throw new Error(`Archive path escapes the archive root: ${relPath}`);
    }
    return join(this.rootDir, normalized);
  }

  exists(relPath: string): boolean
  {
    return existsSync(this.resolve(relPath));
  }

  write(relPath: string, content: string): number
  {
    const absolute = this.resolve(relPath);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
    return statSync(absolute).size;
  }

  read(relPath: string): string
  {
    return readFileSync(this.resolve(relPath), 'utf8');
  }

  size(relPath: string): number
  {
    return statSync(this.resolve(relPath)).size;
  }

  delete(relPath: string): void
  {
    const absolute = this.resolve(relPath);
    if (existsSync(absolute))
    {
      unlinkSync(absolute);
    }
  }

  move(fromRel: string, toRel: string): void
  {
    const from = this.resolve(fromRel);
    const to = this.resolve(toRel);
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);
  }

  ensureDir(relPath: string): void
  {
    mkdirSync(this.resolve(relPath), { recursive: true });
  }

  moveDir(fromRel: string, toRel: string): void
  {
    const from = this.resolve(fromRel);
    const to = this.resolve(toRel);
    mkdirSync(dirname(to), { recursive: true });
    if (existsSync(from))
    {
      renameSync(from, to);
    }
    else
    {
      mkdirSync(to, { recursive: true });
    }
  }

  deleteDir(relPath: string): void
  {
    const absolute = this.resolve(relPath);
    if (absolute === this.rootDir)
    {
      throw new Error('Refusing to delete the archive root');
    }
    rmSync(absolute, { recursive: true, force: true });
  }

  /** Relative paths of every markdown file in the archive, using / separators. */
  scan(): string[]
  {
    const results: string[] = [];
    const walk = (dir: string, prefix: string): void =>
    {
      for (const entry of readdirSync(dir, { withFileTypes: true }))
      {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (entry.isDirectory())
        {
          walk(join(dir, entry.name), rel);
        }
        else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
        {
          results.push(rel);
        }
      }
    };
    walk(this.rootDir, '');
    return results.sort();
  }
}
