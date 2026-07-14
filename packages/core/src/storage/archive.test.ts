import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ArchiveStore } from './archive.js';

describe('ArchiveStore', () =>
{
  let root: string;
  let archive: ArchiveStore;

  beforeEach(() =>
  {
    root = mkdtempSync(join(tmpdir(), 'doc-viewer-archive-'));
    archive = new ArchiveStore(root);
  });

  afterEach(() =>
  {
    rmSync(root, { recursive: true, force: true });
  });

  it('writes and reads files, creating parent directories', () =>
  {
    archive.write('notes/deep/hello.md', '# Hi');
    expect(archive.read('notes/deep/hello.md')).toBe('# Hi');
  });

  it('rejects absolute paths', () =>
  {
    expect(() => archive.resolve('/etc/passwd')).toThrow(/relative/);
  });

  it('rejects paths escaping the archive root', () =>
  {
    expect(() => archive.resolve('../outside.md')).toThrow(/escapes/);
    expect(() => archive.resolve('notes/../../outside.md')).toThrow(/escapes/);
  });

  it('moves files across directories', () =>
  {
    archive.write('a.md', 'x');
    archive.move('a.md', 'sub/b.md');
    expect(archive.exists('a.md')).toBe(false);
    expect(archive.read('sub/b.md')).toBe('x');
  });

  it('scans only markdown files recursively', () =>
  {
    archive.write('one.md', '1');
    archive.write('nested/two.md', '2');
    archive.write('nested/skip.txt', 'no');
    expect(archive.scan()).toEqual(['nested/two.md', 'one.md']);
  });

  it('refuses to delete the archive root as a directory', () =>
  {
    expect(() => archive.deleteDir('.')).toThrow(/root/);
  });
});
