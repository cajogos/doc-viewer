import type { Theme } from '@doc-viewer/core';
import {
  closePdfRenderer,
  htmlToPdf,
  renderMarkdown,
  renderStandaloneHtml,
  titleFromMarkdown
} from '@doc-viewer/core';
import type { Command } from 'commander';
import { InvalidArgumentError } from 'commander';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

type Format = 'html' | 'pdf';

function parseFormat(value: string): Format
{
  if (value !== 'html' && value !== 'pdf')
  {
    throw new InvalidArgumentError('Format must be "html" or "pdf".');
  }
  return value;
}

function parseTheme(value: string): Theme
{
  if (value !== 'light' && value !== 'dark')
  {
    throw new InvalidArgumentError('Theme must be "light" or "dark".');
  }
  return value;
}

export function registerConvertCommand(program: Command): void
{
  program
    .command('convert')
    .description('Convert markdown files to themed HTML or PDF')
    .argument('<files...>', 'markdown files to convert')
    .requiredOption('-t, --to <format>', 'output format: html or pdf', parseFormat)
    .option('--theme <theme>', 'theme: light or dark', parseTheme, 'light')
    .option('-o, --out <dir>', 'output directory (defaults to each source file directory)')
    .action(async (files: string[], options: { to: Format; theme: Theme; out?: string }) =>
    {
      try
      {
        for (const file of files)
        {
          const sourcePath = resolve(file);
          const markdown = readFileSync(sourcePath, 'utf8');
          const { html } = await renderMarkdown(markdown);
          const standalone = renderStandaloneHtml({
            bodyHtml: html,
            title: titleFromMarkdown(markdown, basename(sourcePath)),
            theme: options.theme
          });

          const outDir = options.out ? resolve(options.out) : dirname(sourcePath);
          mkdirSync(outDir, { recursive: true });
          const base = basename(sourcePath, extname(sourcePath));
          const outPath = join(outDir, `${base}.${options.to}`);

          if (options.to === 'html')
          {
            writeFileSync(outPath, standalone, 'utf8');
          }
          else
          {
            writeFileSync(outPath, await htmlToPdf(standalone));
          }
          console.log(outPath);
        }
      }
      finally
      {
        await closePdfRenderer();
      }
    });
}
