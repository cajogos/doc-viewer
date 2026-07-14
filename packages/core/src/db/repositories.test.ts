import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from './database.js';
import type { Database } from './database.js';
import { MIGRATIONS } from './migrations.js';
import { DirectoryRepo, DocumentRepo, SettingsRepo, TagRepo } from './repositories.js';

describe('repositories', () =>
{
  let db: Database;
  let directories: DirectoryRepo;
  let documents: DocumentRepo;
  let tags: TagRepo;
  let settings: SettingsRepo;

  beforeEach(() =>
  {
    db = openDatabase(':memory:');
    directories = new DirectoryRepo(db);
    documents = new DocumentRepo(db);
    tags = new TagRepo(db);
    settings = new SettingsRepo(db);
  });

  afterEach(() =>
  {
    db.close();
  });

  it('applies every migration exactly once', () =>
  {
    expect(db.pragma('user_version', { simple: true })).toBe(MIGRATIONS.length);
  });

  describe('DirectoryRepo', () =>
  {
    it('creates and nests directories', () =>
    {
      const parent = directories.create('guides');
      const child = directories.create('linux', parent.id);
      expect(directories.pathOf(child.id)).toBe('guides/linux');
    });

    it('ensurePath reuses existing chains', () =>
    {
      const leaf = directories.ensurePath(['a', 'b']);
      const again = directories.ensurePath(['a', 'b']);
      expect(again!.id).toBe(leaf!.id);
      expect(directories.list()).toHaveLength(2);
    });

    it('cascades deletion to child directories', () =>
    {
      const parent = directories.create('p');
      directories.create('c', parent.id);
      directories.delete(parent.id);
      expect(directories.list()).toHaveLength(0);
    });

    it('collects subtree ids', () =>
    {
      const a = directories.create('a');
      const b = directories.create('b', a.id);
      const c = directories.create('c', b.id);
      expect(directories.subtreeIds(a.id)).toEqual([a.id, b.id, c.id]);
    });
  });

  describe('DocumentRepo', () =>
  {
    it('creates, updates, and maps rows to camelCase', () =>
    {
      const doc = documents.create({
        directoryId: null,
        title: 'T',
        filename: 'f.md',
        relPath: 'f.md',
        size: 3
      });
      expect(doc.missing).toBe(false);
      documents.update(doc.id, { missing: true, title: 'T2' });
      const updated = documents.get(doc.id)!;
      expect(updated.missing).toBe(true);
      expect(updated.title).toBe('T2');
    });

    it('associates and clears tags', () =>
    {
      const doc = documents.create({
        directoryId: null,
        title: 'T',
        filename: 'f.md',
        relPath: 'f.md',
        size: 1
      });
      const urgent = tags.create('urgent', '#ff0000');
      const idea = tags.create('idea', '#00ff00');
      documents.setTags(doc.id, [urgent.id, idea.id]);
      expect(documents.tagsOf(doc.id).map((tag) => tag.name)).toEqual(['idea', 'urgent']);
      documents.setTags(doc.id, []);
      expect(documents.tagsOf(doc.id)).toHaveLength(0);
    });

    it('removes tag links when a tag is deleted', () =>
    {
      const doc = documents.create({
        directoryId: null,
        title: 'T',
        filename: 'f.md',
        relPath: 'f.md',
        size: 1
      });
      const tag = tags.create('gone', '#123456');
      documents.setTags(doc.id, [tag.id]);
      tags.delete(tag.id);
      expect(documents.tagsOf(doc.id)).toHaveLength(0);
    });

    it('deletes only missing documents with deleteMissing', () =>
    {
      const keep = documents.create({
        directoryId: null,
        title: 'K',
        filename: 'k.md',
        relPath: 'k.md',
        size: 1
      });
      const gone = documents.create({
        directoryId: null,
        title: 'G',
        filename: 'g.md',
        relPath: 'g.md',
        size: 1
      });
      documents.update(gone.id, { missing: true });
      expect(documents.deleteMissing()).toBe(1);
      expect(documents.get(keep.id)).not.toBeNull();
      expect(documents.get(gone.id)).toBeNull();
    });
  });

  describe('TagRepo', () =>
  {
    it('enforces case-insensitive unique names', () =>
    {
      tags.create('Work', '#111111');
      expect(() => tags.create('work', '#222222')).toThrow();
    });

    it('updates name and colour', () =>
    {
      const tag = tags.create('draft', '#aaaaaa');
      tags.update(tag.id, { name: 'final', color: '#bbbbbb' });
      expect(tags.get(tag.id)).toMatchObject({ name: 'final', color: '#bbbbbb' });
    });
  });

  describe('SettingsRepo', () =>
  {
    it('returns defaults when empty', () =>
    {
      expect(settings.getAll()).toEqual({ theme: 'system' });
    });

    it('persists and merges values', () =>
    {
      settings.put({ theme: 'dark' });
      expect(settings.getAll().theme).toBe('dark');
    });
  });
});
