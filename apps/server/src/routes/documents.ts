import type { DocStore, DocumentWithTags } from '@doc-viewer/core';
import { renderMarkdown } from '@doc-viewer/core';
import type { FastifyInstance } from 'fastify';

interface DocumentParams
{
  id: string;
}

interface UploadQuery
{
  directoryId?: string;
}

interface GetQuery
{
  include?: string;
}

interface PatchBody
{
  filename?: string;
  directoryId?: string | null;
  tagIds?: string[];
}

const patchBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    filename: { type: 'string', minLength: 1 },
    directoryId: { type: ['string', 'null'] },
    tagIds: {
      type: 'array',
      items: { type: 'string' }
    }
  }
} as const;

export function registerDocumentRoutes(app: FastifyInstance, store: DocStore): void
{
  app.post<{ Querystring: UploadQuery }>(
    '/api/documents',
    { preHandler: app.requireAuth },
    async (request, reply) =>
    {
      const directoryId = request.query.directoryId ?? null;
      if (directoryId !== null && !store.directories.get(directoryId))
      {
        return reply.status(404).send({ error: `Directory not found: ${directoryId}` });
      }

      const created: DocumentWithTags[] = [];
      for await (const part of request.files())
      {
        if (!part.filename.toLowerCase().endsWith('.md'))
        {
          return reply.status(400).send({ error: `Only .md files are supported: ${part.filename}` });
        }
        const content = (await part.toBuffer()).toString('utf8');
        created.push(store.uploadDocument({ filename: part.filename, content, directoryId }));
      }
      if (created.length === 0)
      {
        return reply.status(400).send({ error: 'No files uploaded' });
      }
      return reply.status(201).send({ documents: created });
    }
  );

  app.get<{ Params: DocumentParams; Querystring: GetQuery }>(
    '/api/documents/:id',
    async (request, reply) =>
    {
      const document = store.documents.get(request.params.id);
      if (!document)
      {
        return reply.status(404).send({ error: 'Document not found' });
      }
      const withTags = store.documents.withTags(document);
      if (request.query.include === 'html')
      {
        if (document.missing)
        {
          return reply.status(404).send({ error: 'Document file is missing from the archive' });
        }
        const { html } = await renderMarkdown(store.readDocument(document.id));
        return { document: withTags, html };
      }
      return { document: withTags };
    }
  );

  app.get<{ Params: DocumentParams }>('/api/documents/:id/raw', async (request, reply) =>
  {
    const document = store.documents.get(request.params.id);
    if (!document || document.missing)
    {
      return reply.status(404).send({ error: 'Document not found' });
    }
    return reply
      .header('content-type', 'text/markdown; charset=utf-8')
      .send(store.readDocument(document.id));
  });

  app.patch<{ Params: DocumentParams; Body: PatchBody }>(
    '/api/documents/:id',
    { schema: { body: patchBodySchema }, preHandler: app.requireAuth },
    async (request, reply) =>
    {
      const { id } = request.params;
      if (!store.documents.get(id))
      {
        return reply.status(404).send({ error: 'Document not found' });
      }
      const body = request.body ?? {};
      if (body.filename !== undefined)
      {
        store.renameDocument(id, body.filename);
      }
      if ('directoryId' in body)
      {
        const directoryId = body.directoryId ?? null;
        if (directoryId !== null && !store.directories.get(directoryId))
        {
          return reply.status(404).send({ error: `Directory not found: ${directoryId}` });
        }
        store.moveDocument(id, directoryId);
      }
      if (body.tagIds !== undefined)
      {
        for (const tagId of body.tagIds)
        {
          if (!store.tags.get(tagId))
          {
            return reply.status(404).send({ error: `Tag not found: ${tagId}` });
          }
        }
        store.documents.setTags(id, body.tagIds);
      }
      return { document: store.documents.withTags(store.documents.get(id)!) };
    }
  );

  app.delete<{ Params: DocumentParams }>(
    '/api/documents/:id',
    { preHandler: app.requireAuth },
    async (request, reply) =>
    {
      if (!store.documents.get(request.params.id))
      {
        return reply.status(404).send({ error: 'Document not found' });
      }
      store.deleteDocument(request.params.id);
      return reply.status(204).send();
    }
  );
}
