import type { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

interface UploadResult
{
  documents: Array<{ id: string; filename: string; relPath: string; title: string }>;
}

const PASSWORD = 'app-test-password';

describe('server API', () =>
{
  let root: string;
  let app: FastifyInstance;
  let cookies: { dv_session: string };

  beforeEach(async () =>
  {
    root = mkdtempSync(join(tmpdir(), 'doc-viewer-server-'));
    app = buildApp({
      archiveDir: join(root, 'archive'),
      dbPath: ':memory:',
      dataDir: join(root, 'data'),
      adminPassword: PASSWORD
    });
    await app.ready();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: PASSWORD }
    });
    cookies = { dv_session: login.cookies.find((c) => c.name === 'dv_session')!.value };
  });

  afterEach(async () =>
  {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  });

  async function upload(filename: string, content: string, directoryId?: string): Promise<UploadResult>
  {
    const form = new FormData();
    form.append('file', Buffer.from(content), { filename, contentType: 'text/markdown' });
    const url = directoryId ? `/api/documents?directoryId=${directoryId}` : '/api/documents';
    const response = await app.inject({
      cookies,
      method: 'POST',
      url,
      payload: form.getBuffer(),
      headers: form.getHeaders()
    });
    expect(response.statusCode).toBe(201);
    return response.json() as UploadResult;
  }

  it('reports health', async () =>
  {
    const response = await app.inject({
      cookies, method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('uploads a markdown file and shows it in the tree', async () =>
  {
    const { documents } = await upload('hello.md', '# Hello\n\nWorld');
    expect(documents[0].title).toBe('Hello');

    const tree = await app.inject({
      cookies, method: 'GET', url: '/api/tree' });
    const body = tree.json() as { tree: Array<{ type: string }> };
    expect(body.tree).toHaveLength(1);
    expect(body.tree[0].type).toBe('document');
  });

  it('rejects non-markdown uploads', async () =>
  {
    const form = new FormData();
    form.append('file', Buffer.from('nope'), { filename: 'evil.exe' });
    const response = await app.inject({
      cookies,
      method: 'POST',
      url: '/api/documents',
      payload: form.getBuffer(),
      headers: form.getHeaders()
    });
    expect(response.statusCode).toBe(400);
  });

  it('serves rendered HTML for a document', async () =>
  {
    const { documents } = await upload('doc.md', '# Title\n\n**bold**');
    const response = await app.inject({
      cookies,
      method: 'GET',
      url: `/api/documents/${documents[0].id}?include=html`
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { html: string };
    expect(body.html).toContain('<strong>bold</strong>');
  });

  it('serves raw markdown', async () =>
  {
    const { documents } = await upload('doc.md', '# Raw');
    const response = await app.inject({
      cookies,
      method: 'GET',
      url: `/api/documents/${documents[0].id}/raw`
    });
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.body).toBe('# Raw');
  });

  it('renames, moves, and tags a document via PATCH', async () =>
  {
    const dirResponse = await app.inject({
      cookies,
      method: 'POST',
      url: '/api/directories',
      payload: { name: 'guides' }
    });
    const { directory } = dirResponse.json() as { directory: { id: string } };

    const tagResponse = await app.inject({
      cookies,
      method: 'POST',
      url: '/api/tags',
      payload: { name: 'urgent', color: '#ff0000' }
    });
    const { tag } = tagResponse.json() as { tag: { id: string } };

    const { documents } = await upload('old.md', 'content');
    const patch = await app.inject({
      cookies,
      method: 'PATCH',
      url: `/api/documents/${documents[0].id}`,
      payload: { filename: 'new.md', directoryId: directory.id, tagIds: [tag.id] }
    });
    expect(patch.statusCode).toBe(200);
    const { document } = patch.json() as {
      document: { relPath: string; tags: Array<{ name: string }> };
    };
    expect(document.relPath).toBe('guides/new.md');
    expect(document.tags[0].name).toBe('urgent');
  });

  it('deletes documents', async () =>
  {
    const { documents } = await upload('bye.md', 'x');
    const del = await app.inject({
      cookies, method: 'DELETE', url: `/api/documents/${documents[0].id}` });
    expect(del.statusCode).toBe(204);
    const get = await app.inject({
      cookies, method: 'GET', url: `/api/documents/${documents[0].id}` });
    expect(get.statusCode).toBe(404);
  });

  it('returns 404 for unknown documents', async () =>
  {
    const response = await app.inject({
      cookies, method: 'GET', url: '/api/documents/nope' });
    expect(response.statusCode).toBe(404);
  });

  it('manages directories', async () =>
  {
    const create = await app.inject({
      cookies,
      method: 'POST',
      url: '/api/directories',
      payload: { name: 'a' }
    });
    expect(create.statusCode).toBe(201);
    const { directory } = create.json() as { directory: { id: string } };

    const rename = await app.inject({
      cookies,
      method: 'PATCH',
      url: `/api/directories/${directory.id}`,
      payload: { name: 'b' }
    });
    expect((rename.json() as { directory: { name: string } }).directory.name).toBe('b');

    const del = await app.inject({
      cookies, method: 'DELETE', url: `/api/directories/${directory.id}` });
    expect(del.statusCode).toBe(204);
  });

  it('rejects duplicate tag names with 409', async () =>
  {
    await app.inject({
      cookies, method: 'POST', url: '/api/tags', payload: { name: 'dup', color: '#111111' } });
    const second = await app.inject({
      cookies,
      method: 'POST',
      url: '/api/tags',
      payload: { name: 'DUP', color: '#222222' }
    });
    expect(second.statusCode).toBe(409);
  });

  it('validates tag colours', async () =>
  {
    const response = await app.inject({
      cookies,
      method: 'POST',
      url: '/api/tags',
      payload: { name: 'bad', color: 'red' }
    });
    expect(response.statusCode).toBe(400);
  });

  it('stores settings', async () =>
  {
    const put = await app.inject({
      cookies,
      method: 'PUT',
      url: '/api/settings',
      payload: { theme: 'dark' }
    });
    expect((put.json() as { settings: { theme: string } }).settings.theme).toBe('dark');

    const get = await app.inject({
      cookies, method: 'GET', url: '/api/settings' });
    expect((get.json() as { settings: { theme: string } }).settings.theme).toBe('dark');
  });

  it('exports a document as standalone themed HTML', async () =>
  {
    const { documents } = await upload('export-me.md', '# Exported\n\ncontent');
    const response = await app.inject({
      cookies,
      method: 'GET',
      url: `/api/documents/${documents[0].id}/export?format=html&theme=dark`
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['content-disposition']).toContain('export-me.html');
    expect(response.body).toContain('data-theme="dark"');
    expect(response.body).toContain('--dv-bg');
    expect(response.body).toContain('<h1>Exported</h1>');
  });

  it('rejects unknown export formats', async () =>
  {
    const { documents } = await upload('fmt.md', 'x');
    const response = await app.inject({
      cookies,
      method: 'GET',
      url: `/api/documents/${documents[0].id}/export?format=docx`
    });
    expect(response.statusCode).toBe(400);
  });

  it('indexes files dropped directly into the archive via sync', async () =>
  {
    writeFileSync(join(root, 'archive', 'external.md'), '# External');
    const sync = await app.inject({
      cookies, method: 'POST', url: '/api/sync' });
    expect((sync.json() as { added: number }).added).toBe(1);
  });
});
