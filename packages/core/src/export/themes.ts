import type { Theme } from '../types.js';

// Single source of truth for theme styling. The web UI, standalone HTML
// exports, and PDF exports all consume these constants so a document looks
// identical in every medium. This module must stay browser-safe: no Node.js
// imports.

export const THEMES: readonly Theme[] = ['light', 'dark'];

export const THEME_TOKENS_CSS = `
:root,
[data-theme='light']
{
  color-scheme: light;
  --dv-bg: #ffffff;
  --dv-bg-secondary: #f6f8fa;
  --dv-bg-hover: #eaeef2;
  --dv-fg: #1f2328;
  --dv-fg-muted: #59636e;
  --dv-border: #d1d9e0;
  --dv-accent: #0969da;
  --dv-accent-fg: #ffffff;
  --dv-danger: #d1242f;
  --dv-code-bg: #f6f8fa;
  --dv-shadow: 0 8px 24px rgba(31, 35, 40, 0.12);
}

[data-theme='dark']
{
  color-scheme: dark;
  --dv-bg: #0d1117;
  --dv-bg-secondary: #161b22;
  --dv-bg-hover: #21262d;
  --dv-fg: #e6edf3;
  --dv-fg-muted: #9198a1;
  --dv-border: #3d444d;
  --dv-accent: #4493f8;
  --dv-accent-fg: #0d1117;
  --dv-danger: #f85149;
  --dv-code-bg: #161b22;
  --dv-shadow: 0 8px 24px rgba(1, 4, 9, 0.8);
}
`;

export const DOC_CSS = `
.doc-body
{
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--dv-fg);
  background-color: var(--dv-bg);
  word-wrap: break-word;
}

.doc-body h1,
.doc-body h2,
.doc-body h3,
.doc-body h4,
.doc-body h5,
.doc-body h6
{
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.doc-body h1
{
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--dv-border);
}

.doc-body h2
{
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--dv-border);
}

.doc-body h3 { font-size: 1.25em; }
.doc-body h4 { font-size: 1em; }

.doc-body p,
.doc-body ul,
.doc-body ol,
.doc-body table,
.doc-body blockquote,
.doc-body pre
{
  margin-top: 0;
  margin-bottom: 16px;
}

.doc-body a
{
  color: var(--dv-accent);
  text-decoration: none;
}

.doc-body a:hover { text-decoration: underline; }

.doc-body ul,
.doc-body ol
{
  padding-left: 2em;
}

.doc-body li + li { margin-top: 0.25em; }

.doc-body li.task-list-item { list-style-type: none; }

.doc-body li.task-list-item input[type='checkbox']
{
  margin: 0 0.35em 0.25em -1.6em;
  vertical-align: middle;
}

.doc-body blockquote
{
  padding: 0 1em;
  color: var(--dv-fg-muted);
  border-left: 0.25em solid var(--dv-border);
}

.doc-body table
{
  border-spacing: 0;
  border-collapse: collapse;
  display: block;
  width: max-content;
  max-width: 100%;
  overflow: auto;
}

.doc-body th,
.doc-body td
{
  padding: 6px 13px;
  border: 1px solid var(--dv-border);
}

.doc-body th { font-weight: 600; }

.doc-body tr:nth-child(2n) { background-color: var(--dv-bg-secondary); }

.doc-body img
{
  max-width: 100%;
  background-color: var(--dv-bg);
}

.doc-body code
{
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 85%;
  padding: 0.2em 0.4em;
  border-radius: 6px;
  background-color: var(--dv-code-bg);
}

.doc-body pre
{
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  border-radius: 6px;
  background-color: var(--dv-code-bg) !important;
}

.doc-body pre code
{
  padding: 0;
  font-size: 100%;
  background: transparent;
}

.doc-body hr
{
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: var(--dv-border);
  border: 0;
}

/* Shiki dual-theme support: the highlighter emits inline light colours plus
   --shiki-dark custom properties; dark mode flips to them here. */
[data-theme='dark'] .doc-body .shiki,
[data-theme='dark'] .doc-body .shiki span
{
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
`;

export const THEME_CSS = THEME_TOKENS_CSS + DOC_CSS;
