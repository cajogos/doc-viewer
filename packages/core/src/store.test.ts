import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DocStore } from './store.js';

describe('DocStore', () =>
{
  let root: string;
  let store: DocStore;

  beforeEach(() =>
  {
    root = mkdtempSync(join(tmpdir(), 'doc-viewer-store-'));
    store = new DocStore({
      archiveDir: join(root, 'archive'),
      dbPath: ':memory:'
    });
  });

  afterEach(() =>
  {
    store.close();
    rmSync(root, { recursive: true, force: true });
  });

  it('uploads a document and extracts its title', () =>
  {
    const doc = store.uploadDocument({ filename: 'readme.md', content: '# Hello World\n\ntext' });
    expect(doc.title).toBe('Hello World');
    expect(store.archive.read('readme.md')).toContain('Hello World');
  });

  it('appends .md and uniquifies duplicate filenames', () =>
  {
    store.uploadDocument({ filename: 'notes', content: 'a' });
    const second = store.uploadDocument({ filename: 'notes.md', content: 'b' });
    expect(second.filename).toBe('notes-1.md');
    expect(store.archive.read('notes-1.md')).toBe('b');
  });

  it('stores documents inside their directory on disk', () =>
  {
    const dir = store.createDirectory('guides');
    const doc = store.uploadDocument({ filename: 'a.md', content: 'x', directoryId: dir.id });
    expect(doc.relPath).toBe('guides/a.md');
    expect(store.archive.exists('guides/a.md')).toBe(true);
  });

  it('builds a nested tree with documents attached to directories', () =>
  {
    const dir = store.createDirectory('guides');
    store.uploadDocument({ filename: 'inside.md', content: 'x', directoryId: dir.id });
    store.uploadDocument({ filename: 'top.md', content: 'y' });
    const tree = store.tree();
    expect(tree).toHaveLength(2);
    const dirNode = tree.find((node) => node.type === 'directory');
    expect(dirNode?.type === 'directory' && dirNode.children).toHaveLength(1);
  });

  it('renames a directory and updates document paths on disk and in DB', () =>
  {
    const dir = store.createDirectory('old');
    const doc = store.uploadDocument({ filename: 'a.md', content: 'x', directoryId: dir.id });
    store.renameDirectory(dir.id, 'new');
    const updated = store.documents.get(doc.id)!;
    expect(updated.relPath).toBe('new/a.md');
    expect(store.archive.exists('new/a.md')).toBe(true);
    expect(store.archive.exists('old/a.md')).toBe(false);
  });

  it('refuses to move a directory into its own subtree', () =>
  {
    const parent = store.createDirectory('parent');
    const child = store.createDirectory('child', parent.id);
    expect(() => store.moveDirectory(parent.id, child.id)).toThrow(/itself/);
  });

  it('deletes a directory together with its documents', () =>
  {
    const dir = store.createDirectory('gone');
    const doc = store.uploadDocument({ filename: 'a.md', content: 'x', directoryId: dir.id });
    store.deleteDirectory(dir.id);
    expect(store.documents.get(doc.id)).toBeNull();
    expect(store.archive.exists('gone/a.md')).toBe(false);
    expect(store.tree()).toHaveLength(0);
  });

  it('moves a document between directories', () =>
  {
    const dir = store.createDirectory('target');
    const doc = store.uploadDocument({ filename: 'a.md', content: 'x' });
    const moved = store.moveDocument(doc.id, dir.id);
    expect(moved.relPath).toBe('target/a.md');
    expect(store.archive.exists('target/a.md')).toBe(true);
  });

  it('deletes a document from disk and DB', () =>
  {
    const doc = store.uploadDocument({ filename: 'a.md', content: 'x' });
    store.deleteDocument(doc.id);
    expect(store.documents.get(doc.id)).toBeNull();
    expect(store.archive.exists('a.md')).toBe(false);
  });

  describe('sync', () =>
  {
    it('indexes files that appeared on disk', () =>
    {
      store.archive.write('dropped/new.md', '# Dropped');
      const result = store.sync();
      expect(result.added).toBe(1);
      const doc = store.documents.getByRelPath('dropped/new.md')!;
      expect(doc.title).toBe('Dropped');
      expect(store.directories.pathOf(doc.directoryId!)).toBe('dropped');
    });

    it('flags vanished files as missing and restores them when they return', () =>
    {
      const doc = store.uploadDocument({ filename: 'a.md', content: 'x' });
      store.archive.delete('a.md');
      expect(store.sync().markedMissing).toBe(1);
      expect(store.documents.get(doc.id)!.missing).toBe(true);

      store.archive.write('a.md', 'x');
      expect(store.sync().restored).toBe(1);
      expect(store.documents.get(doc.id)!.missing).toBe(false);
    });

    it('prunes missing documents on request', () =>
    {
      store.uploadDocument({ filename: 'a.md', content: 'x' });
      store.archive.delete('a.md');
      store.sync();
      expect(store.pruneMissing()).toBe(1);
      expect(store.documents.list()).toHaveLength(0);
    });
  });
});
