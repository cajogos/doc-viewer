import { afterAll, describe, expect, it } from 'vitest';
import { renderStandaloneHtml } from './html-template.js';
import { closePdfRenderer, htmlToPdf } from './pdf.js';

// Requires a local Chromium (pnpm exec playwright install chromium).
// Enabled with PLAYWRIGHT_TESTS=1 so the default suite stays browser-free.
describe.skipIf(process.env.PLAYWRIGHT_TESTS !== '1')('htmlToPdf', () =>
{
  afterAll(async () =>
  {
    await closePdfRenderer();
  });

  it('renders themed HTML to a PDF document', async () =>
  {
    const html = renderStandaloneHtml({
      bodyHtml: '<h1>PDF smoke test</h1><p>content</p>',
      title: 'Smoke',
      theme: 'dark'
    });
    const pdf = await htmlToPdf(html);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
  }, 30_000);
});
