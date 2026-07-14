import rehypeShiki from '@shikijs/rehype';
import type { Heading, Node, Root } from 'mdast';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { sanitizeSchema } from './sanitize-schema.js';

export interface RenderResult
{
  html: string;
  title: string | null;
}

// Sanitisation runs BEFORE shiki so the highlighter's inline styles and class
// names are not stripped; shiki output is generated, not user-supplied.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeShiki, {
    themes: {
      light: 'github-light',
      dark: 'github-dark'
    },
    fallbackLanguage: 'text'
  })
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<RenderResult>
{
  const mdast = processor.parse(markdown);
  const title = extractTitle(mdast);
  const hast = await processor.run(mdast);
  const html = processor.stringify(hast);
  return { html: String(html), title };
}

function extractTitle(tree: Root): string | null
{
  for (const node of tree.children)
  {
    if (node.type === 'heading' && (node as Heading).depth === 1)
    {
      const text = collectText(node).trim();
      return text.length > 0 ? text : null;
    }
  }
  return null;
}

function collectText(node: Node): string
{
  if ('value' in node && typeof node.value === 'string')
  {
    return node.value;
  }
  if ('children' in node && Array.isArray(node.children))
  {
    return (node.children as Node[]).map(collectText).join('');
  }
  return '';
}
