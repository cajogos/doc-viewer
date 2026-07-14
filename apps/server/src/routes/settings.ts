import type { DocStore, Settings } from '@doc-viewer/core';
import type { FastifyInstance } from 'fastify';

const putBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    theme: { type: 'string', enum: ['light', 'dark', 'system'] }
  }
} as const;

export function registerSettingsRoutes(app: FastifyInstance, store: DocStore): void
{
  app.get('/api/settings', async () => ({ settings: store.settings.getAll() }));

  app.put<{ Body: Partial<Settings> }>(
    '/api/settings',
    { schema: { body: putBodySchema } },
    async (request) => ({ settings: store.settings.put(request.body ?? {}) })
  );
}
