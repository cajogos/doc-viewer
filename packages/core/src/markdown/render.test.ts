import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './render.js';

describe('renderMarkdown', () =>
{
  it('renders basic markdown to HTML', async () =>
  {
    const { html } = await renderMarkdown('Hello **world**');
    expect(html).toContain('<strong>world</strong>');
  });

  it('renders GFM tables', async () =>
  {
    const { html } = await renderMarkdown('| a | b |\n| - | - |\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });

  it('renders GFM strikethrough', async () =>
  {
    const { html } = await renderMarkdown('~~gone~~');
    expect(html).toContain('<del>gone</del>');
  });

  it('renders GFM task lists with checkboxes', async () =>
  {
    const { html } = await renderMarkdown('- [x] done\n- [ ] todo');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
  });

  it('strips raw HTML such as script tags', async () =>
  {
    const { html } = await renderMarkdown('hello\n\n<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert(1)');
  });

  it('strips javascript: links', async () =>
  {
    const { html } = await renderMarkdown('[click](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('highlights code blocks with dual-theme shiki output', async () =>
  {
    const { html } = await renderMarkdown('```js\nconst x = 1;\n```');
    expect(html).toContain('shiki');
    expect(html).toContain('--shiki-dark');
  });

  it('does not throw on unknown code block languages', async () =>
  {
    const { html } = await renderMarkdown('```notalanguage\nfoo\n```');
    expect(html).toContain('foo');
  });

  it('extracts the first h1 as title', async () =>
  {
    const { title } = await renderMarkdown('# My Doc\n\n# Second');
    expect(title).toBe('My Doc');
  });

  it('extracts titles containing inline code and emphasis', async () =>
  {
    const { title } = await renderMarkdown('# Using `foo` and *bar*');
    expect(title).toBe('Using foo and bar');
  });

  it('returns null title when there is no h1', async () =>
  {
    const { title } = await renderMarkdown('## Only h2\n\ntext');
    expect(title).toBeNull();
  });
});
