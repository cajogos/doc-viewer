import type { FastifyInstance } from 'fastify';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';

const PASSWORD = 'test-admin-password';

describe('authentication', () =>
{
  let root: string;
  let app: FastifyInstance;

  beforeEach(async () =>
  {
    root = mkdtempSync(join(tmpdir(), 'doc-viewer-auth-server-'));
    app = buildApp({
      archiveDir: join(root, 'archive'),
      dbPath: ':memory:',
      dataDir: join(root, 'data'),
      adminPassword: PASSWORD
    });
    await app.ready();
  });

  afterEach(async () =>
  {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  });

  async function login(): Promise<{ dv_session: string }>
  {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: PASSWORD }
    });
    expect(response.statusCode).toBe(200);
    const cookie = response.cookies.find((c) => c.name === 'dv_session')!;
    return { dv_session: cookie.value };
  }

  it('rejects a wrong password with 401', async () =>
  {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'nope' }
    });
    expect(response.statusCode).toBe(401);
  });

  it('logs in with the seeded password and reports state via me', async () =>
  {
    const cookies = await login();
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', cookies });
    expect(me.json()).toEqual({ authenticated: true, username: 'admin' });
  });

  it('reports unauthenticated without a session', async () =>
  {
    const me = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(me.json()).toEqual({ authenticated: false });
  });

  it('rejects a tampered session cookie', async () =>
  {
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { dv_session: '{"u":"admin","exp":99999999999999}.forged' }
    });
    expect(me.json()).toEqual({ authenticated: false });
  });

  it('blocks every mutating route without a session', async () =>
  {
    const attempts: Array<{ method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'; url: string; payload?: unknown }> = [
      { method: 'POST', url: '/api/documents' },
      { method: 'PATCH', url: '/api/documents/any', payload: { filename: 'x.md' } },
      { method: 'DELETE', url: '/api/documents/any' },
      { method: 'POST', url: '/api/directories', payload: { name: 'x' } },
      { method: 'PATCH', url: '/api/directories/any', payload: { name: 'x' } },
      { method: 'DELETE', url: '/api/directories/any' },
      { method: 'POST', url: '/api/tags', payload: { name: 'x', color: '#112233' } },
      { method: 'PATCH', url: '/api/tags/any', payload: { name: 'y' } },
      { method: 'DELETE', url: '/api/tags/any' },
      { method: 'PUT', url: '/api/settings', payload: { theme: 'dark' } },
      { method: 'POST', url: '/api/sync' },
      { method: 'POST', url: '/api/prune' }
    ];
    for (const attempt of attempts)
    {
      const response = await app.inject(attempt);
      expect(response.statusCode, `${attempt.method} ${attempt.url}`).toBe(401);
    }
  });

  it('keeps read and export routes public', async () =>
  {
    const cookies = await login();
    const dir = await app.inject({
      method: 'POST',
      url: '/api/directories',
      payload: { name: 'public' },
      cookies
    });
    expect(dir.statusCode).toBe(201);

    for (const url of ['/api/tree', '/api/tags', '/api/settings', '/api/health'])
    {
      const response = await app.inject({ method: 'GET', url });
      expect(response.statusCode, url).toBe(200);
    }
  });

  it('allows mutations with a session and blocks again after logout', async () =>
  {
    const cookies = await login();
    const create = await app.inject({
      method: 'POST',
      url: '/api/tags',
      payload: { name: 'secured', color: '#123456' },
      cookies
    });
    expect(create.statusCode).toBe(201);

    const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', cookies });
    expect(logout.statusCode).toBe(200);

    const withoutSession = await app.inject({
      method: 'POST',
      url: '/api/tags',
      payload: { name: 'blocked', color: '#123456' }
    });
    expect(withoutSession.statusCode).toBe(401);
  });
});
