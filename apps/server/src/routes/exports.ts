import type { DocStore, Theme } from '@doc-viewer/core';
import { htmlToPdf, renderMarkdown, renderStandaloneHtml } from '@doc-viewer/core';
import type { FastifyInstance } from 'fastify';

interface ExportParams
{
  id: string;
}

interface ExportQuery
{
  format?: 'html' | 'pdf';
  theme?: Theme;
}

const querySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    format: { type: 'string', enum: ['html', 'pdf'] },
    theme: { type: 'string', enum: ['light', 'dark'] }
  }
} as const;

export function registerExportRoutes(app: FastifyInstance, store: DocStore): void
{
  app.get<{ Params: ExportParams; Querystring: ExportQuery }>(
    '/api/documents/:id/export',
    { schema: { querystring: querySchema } },
    async (request, reply) =>
    {
      const document = store.documents.get(request.params.id);
      if (!document || document.missing)
      {
        return reply.status(404).send({ error: 'Document not found' });
      }

      const format = request.query.format ?? 'html';
      const theme = request.query.theme ?? 'light';
      const { html } = await renderMarkdown(store.readDocument(document.id));
      const standalone = renderStandaloneHtml({
        bodyHtml: html,
        title: document.title,
        theme
      });
      const base = document.filename.replace(/\.md$/i, '').replaceAll('"', '');

      if (format === 'html')
      {
        return reply
          .header('content-type', 'text/html; charset=utf-8')
          .header('content-disposition', `attachment; filename="${base}.html"`)
          .send(standalone);
      }

      const pdf = await htmlToPdf(standalone);
      return reply
        .header('content-type', 'application/pdf')
        .header('content-disposition', `attachment; filename="${base}.pdf"`)
        .send(pdf);
    }
  );
}
