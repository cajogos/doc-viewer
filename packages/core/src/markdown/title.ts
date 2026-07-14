import { basename } from 'node:path';

/**
 * Fast title extraction for storage metadata: first ATX h1 outside of code
 * fences, falling back to the filename without its extension.
 */
export function titleFromMarkdown(markdown: string, filename: string): string
{
  let inFence = false;
  for (const line of markdown.split('\n'))
  {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~'))
    {
      inFence = !inFence;
      continue;
    }
    if (inFence)
    {
      continue;
    }
    const match = /^#[ \t]+(.+?)\s*#*\s*$/.exec(trimmed);
    if (match)
    {
      return match[1];
    }
  }
  return basename(filename).replace(/\.md$/i, '');
}
