import type { DocStore } from '@doc-viewer/core';
import type { FastifyInstance } from 'fastify';

interface TagParams
{
  id: string;
}

interface CreateBody
{
  name: string;
  color: string;
}

interface PatchBody
{
  name?: string;
  color?: string;
}

const colorPattern = '^#[0-9a-fA-F]{6}$';

const createBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'color'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 50 },
    color: { type: 'string', pattern: colorPattern }
  }
} as const;

const patchBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 50 },
    color: { type: 'string', pattern: colorPattern }
  }
} as const;

export function registerTagRoutes(app: FastifyInstance, store: DocStore): void
{
  app.get('/api/tags', async () => ({ tags: store.tags.list() }));

  app.post<{ Body: CreateBody }>(
    '/api/tags',
    { schema: { body: createBodySchema }, preHandler: app.requireAuth },
    async (request, reply) =>
    {
      const tag = store.tags.create(request.body.name, request.body.color);
      return reply.status(201).send({ tag });
    }
  );

  app.patch<{ Params: TagParams; Body: PatchBody }>(
    '/api/tags/:id',
    { schema: { body: patchBodySchema }, preHandler: app.requireAuth },
    async (request, reply) =>
    {
      if (!store.tags.get(request.params.id))
      {
        return reply.status(404).send({ error: 'Tag not found' });
      }
      store.tags.update(request.params.id, request.body ?? {});
      return { tag: store.tags.get(request.params.id) };
    }
  );

  app.delete<{ Params: TagParams }>(
    '/api/tags/:id',
    { preHandler: app.requireAuth },
    async (request, reply) =>
    {
      if (!store.tags.get(request.params.id))
      {
        return reply.status(404).send({ error: 'Tag not found' });
      }
      store.tags.delete(request.params.id);
      return reply.status(204).send();
    }
  );
}
