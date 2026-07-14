import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import type { BootstrapResult } from '@doc-viewer/core';
import { bootstrapAdmin, closePdfRenderer, DocStore } from '@doc-viewer/core';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import Fastify from 'fastify';
import { existsSync } from 'node:fs';
import { getSessionUser, loadOrCreateCookieSecret } from './auth/session.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerDirectoryRoutes } from './routes/directories.js';
import { registerDocumentRoutes } from './routes/documents.js';
import { registerExportRoutes } from './routes/exports.js';
import { registerSettingsRoutes } from './routes/settings.js';
import { registerTagRoutes } from './routes/tags.js';
import { registerTreeRoutes } from './routes/tree.js';

export interface AppOptions
{
  archiveDir: string;
  dbPath: string;
  dataDir: string;
  adminPassword?: string;
  webDistDir?: string;
  logger?: boolean;
}

export function buildApp(options: AppOptions): FastifyInstance
{
  const app = Fastify({ logger: options.logger ?? false });
  const store = new DocStore({ archiveDir: options.archiveDir, dbPath: options.dbPath });
  store.sync();
  const bootstrap = bootstrapAdmin(store, options.adminPassword);

  app.decorate('store', store);
  app.decorate('bootstrapResult', bootstrap);
  app.register(cookie, { secret: loadOrCreateCookieSecret(options.dataDir) });
  app.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) =>
  {
    if (getSessionUser(request) === null)
    {
      return reply.status(401).send({ error: 'Authentication required' });
    }
  });
  app.addHook('onClose', async () =>
  {
    await closePdfRenderer();
    store.close();
  });

  app.setErrorHandler((error: FastifyError, _request, reply) =>
  {
    const message = error.message ?? 'Internal error';
    if (/not found/i.test(message))
    {
      return reply.status(404).send({ error: message });
    }
    if (/invalid|cannot|must be|escapes/i.test(message))
    {
      return reply.status(400).send({ error: message });
    }
    if (/UNIQUE constraint/i.test(message))
    {
      return reply.status(409).send({ error: 'A record with that name already exists' });
    }
    if (error.statusCode && error.statusCode < 500)
    {
      return reply.status(error.statusCode).send({ error: message });
    }
    app.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  });

  app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024,
      files: 100
    }
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  registerAuthRoutes(app, store);
  registerTreeRoutes(app, store);
  registerDocumentRoutes(app, store);
  registerExportRoutes(app, store);
  registerDirectoryRoutes(app, store);
  registerTagRoutes(app, store);
  registerSettingsRoutes(app, store);

  if (options.webDistDir && existsSync(options.webDistDir))
  {
    app.register(fastifyStatic, {
      root: options.webDistDir,
      wildcard: false
    });
    app.setNotFoundHandler((request, reply) =>
    {
      if (request.raw.url?.startsWith('/api/'))
      {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}

declare module 'fastify'
{
  interface FastifyInstance
  {
    store: DocStore;
    bootstrapResult: BootstrapResult;
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
  }
}
