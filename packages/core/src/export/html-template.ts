import type { Theme } from '../types.js';
import { THEME_CSS } from './themes.js';

export interface StandaloneHtmlOptions
{
  bodyHtml: string;
  title: string;
  theme: Theme;
}

const PAGE_CSS = `
body
{
  margin: 0;
  background-color: var(--dv-bg);
}

main.doc-body
{
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 32px;
}

@media print
{
  main.doc-body
  {
    max-width: none;
    padding: 0;
  }
}
`;

export function renderStandaloneHtml(options: StandaloneHtmlOptions): string
{
  const { bodyHtml, title, theme } = options;
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${THEME_CSS}${PAGE_CSS}</style>
</head>
<body>
<main class="doc-body">
${bodyHtml}
</main>
</body>
</html>
`;
}

export function escapeHtml(value: string): string
{
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
