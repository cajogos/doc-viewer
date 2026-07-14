import type { DocStore } from '@doc-viewer/core';
import type { FastifyInstance } from 'fastify';

export function registerTreeRoutes(app: FastifyInstance, store: DocStore): void
{
  app.get('/api/tree', async () => ({ tree: store.tree() }));

  app.post('/api/sync', { preHandler: app.requireAuth }, async () => store.sync());

  app.post('/api/prune', { preHandler: app.requireAuth }, async () => ({
    pruned: store.pruneMissing()
  }));
}
