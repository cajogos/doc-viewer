import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { DocStore } from '@doc-viewer/core';
import type { FastifyError, FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { existsSync } from 'node:fs';
import { registerDirectoryRoutes } from './routes/directories.js';
import { registerDocumentRoutes } from './routes/documents.js';
import { registerSettingsRoutes } from './routes/settings.js';
import { registerTagRoutes } from './routes/tags.js';
import { registerTreeRoutes } from './routes/tree.js';

export interface AppOptions
{
  archiveDir: string;
  dbPath: string;
  webDistDir?: string;
  logger?: boolean;
}

export function buildApp(options: AppOptions): FastifyInstance
{
  const app = Fastify({ logger: options.logger ?? false });
  const store = new DocStore({ archiveDir: options.archiveDir, dbPath: options.dbPath });
  store.sync();

  app.decorate('store', store);
  app.addHook('onClose', async () =>
  {
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

  registerTreeRoutes(app, store);
  registerDocumentRoutes(app, store);
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
  }
}
