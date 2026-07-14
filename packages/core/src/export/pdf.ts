import type { Browser } from 'playwright';
import { chromium } from 'playwright';

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser>
{
  if (!browserPromise)
  {
    browserPromise = chromium.launch().catch((error: Error) =>
    {
      browserPromise = null;
      throw new Error(
        'Could not launch Chromium for PDF rendering. ' +
          'Install it with: pnpm exec playwright install chromium\n' +
          `Original error: ${error.message}`
      );
    });
  }
  return browserPromise;
}

export interface PdfOptions
{
  format?: 'A4' | 'Letter';
}

/** Renders a self-contained HTML document (see renderStandaloneHtml) to PDF. */
export async function htmlToPdf(html: string, options: PdfOptions = {}): Promise<Buffer>
{
  const browser = await getBrowser();
  const page = await browser.newPage();
  try
  {
    await page.setContent(html, { waitUntil: 'load' });
    return await page.pdf({
      format: options.format ?? 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '15mm', right: '15mm' }
    });
  }
  finally
  {
    await page.close();
  }
}

/** Shuts down the shared browser. Safe to call when nothing was rendered. */
export async function closePdfRenderer(): Promise<void>
{
  if (browserPromise)
  {
    const pending = browserPromise;
    browserPromise = null;
    const browser = await pending.catch(() => null);
    await browser?.close();
  }
}
