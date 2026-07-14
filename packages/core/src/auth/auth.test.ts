import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DocStore } from '../store.js';
import { ADMIN_USERNAME, bootstrapAdmin } from './bootstrap.js';
import { generatePassword, hashPassword, verifyPassword } from './password.js';

describe('password hashing', () =>
{
  it('verifies a correct password and rejects a wrong one', () =>
  {
    const stored = hashPassword('correct horse');
    expect(stored).toMatch(/^scrypt\$\d+\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(verifyPassword('correct horse', stored)).toBe(true);
    expect(verifyPassword('battery staple', stored)).toBe(false);
  });

  it('produces unique hashes per call (random salt)', () =>
  {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
  });

  it('rejects malformed stored values', () =>
  {
    expect(verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(verifyPassword('x', 'scrypt$abc$00$00')).toBe(false);
    expect(verifyPassword('x', '')).toBe(false);
  });

  it('generates URL-safe passwords of the requested length', () =>
  {
    const password = generatePassword();
    expect(password).toHaveLength(24);
    expect(password).toMatch(/^[A-Za-z0-9]+$/);
    expect(generatePassword()).not.toBe(password);
  });
});

describe('bootstrapAdmin', () =>
{
  let root: string;
  let store: DocStore;

  beforeEach(() =>
  {
    root = mkdtempSync(join(tmpdir(), 'doc-viewer-auth-'));
    store = new DocStore({ archiveDir: join(root, 'archive'), dbPath: ':memory:' });
  });

  afterEach(() =>
  {
    store.close();
    rmSync(root, { recursive: true, force: true });
  });

  it('creates the admin with a provided password', () =>
  {
    const result = bootstrapAdmin(store, 'from-env');
    expect(result).toEqual({ created: true, rotated: false });
    const user = store.users.getByUsername(ADMIN_USERNAME)!;
    expect(verifyPassword('from-env', user.passwordHash)).toBe(true);
  });

  it('generates and returns a password when none is provided', () =>
  {
    const result = bootstrapAdmin(store);
    expect(result.created).toBe(true);
    expect(result.generatedPassword).toBeDefined();
    const user = store.users.getByUsername(ADMIN_USERNAME)!;
    expect(verifyPassword(result.generatedPassword!, user.passwordHash)).toBe(true);
  });

  it('rotates the hash when the provided password changes', () =>
  {
    bootstrapAdmin(store, 'old-password');
    const result = bootstrapAdmin(store, 'new-password');
    expect(result).toEqual({ created: false, rotated: true });
    const user = store.users.getByUsername(ADMIN_USERNAME)!;
    expect(verifyPassword('new-password', user.passwordHash)).toBe(true);
    expect(verifyPassword('old-password', user.passwordHash)).toBe(false);
  });

  it('is a no-op when the password still matches or none is provided', () =>
  {
    bootstrapAdmin(store, 'stable');
    expect(bootstrapAdmin(store, 'stable')).toEqual({ created: false, rotated: false });
    expect(bootstrapAdmin(store)).toEqual({ created: false, rotated: false });
  });
});
