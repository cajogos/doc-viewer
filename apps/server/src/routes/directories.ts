import type { DocStore } from '@doc-viewer/core';
import type { FastifyInstance } from 'fastify';

interface DirectoryParams
{
  id: string;
}

interface CreateBody
{
  name: string;
  parentId?: string | null;
}

interface PatchBody
{
  name?: string;
  parentId?: string | null;
}

const createBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1 },
    parentId: { type: ['string', 'null'] }
  }
} as const;

const patchBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1 },
    parentId: { type: ['string', 'null'] }
  }
} as const;

export function registerDirectoryRoutes(app: FastifyInstance, store: DocStore): void
{
  app.post<{ Body: CreateBody }>(
    '/api/directories',
    { schema: { body: createBodySchema } },
    async (request, reply) =>
    {
      const parentId = request.body.parentId ?? null;
      if (parentId !== null && !store.directories.get(parentId))
      {
        return reply.status(404).send({ error: `Directory not found: ${parentId}` });
      }
      const directory = store.createDirectory(request.body.name, parentId);
      return reply.status(201).send({ directory });
    }
  );

  app.patch<{ Params: DirectoryParams; Body: PatchBody }>(
    '/api/directories/:id',
    { schema: { body: patchBodySchema } },
    async (request, reply) =>
    {
      const { id } = request.params;
      if (!store.directories.get(id))
      {
        return reply.status(404).send({ error: 'Directory not found' });
      }
      const body = request.body ?? {};
      if ('parentId' in body)
      {
        const parentId = body.parentId ?? null;
        if (parentId !== null && !store.directories.get(parentId))
        {
          return reply.status(404).send({ error: `Directory not found: ${parentId}` });
        }
        store.moveDirectory(id, parentId);
      }
      if (body.name !== undefined)
      {
        store.renameDirectory(id, body.name);
      }
      return { directory: store.directories.get(id) };
    }
  );

  app.delete<{ Params: DirectoryParams }>('/api/directories/:id', async (request, reply) =>
  {
    if (!store.directories.get(request.params.id))
    {
      return reply.status(404).send({ error: 'Directory not found' });
    }
    store.deleteDirectory(request.params.id);
    return reply.status(204).send();
  });
}
