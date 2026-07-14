import { describe, expect, it } from 'vitest';
import { renderStandaloneHtml } from './html-template.js';
import { THEME_CSS } from './themes.js';

describe('THEME_CSS', () =>
{
  it('defines tokens for both themes', () =>
  {
    expect(THEME_CSS).toContain("[data-theme='light']");
    expect(THEME_CSS).toContain("[data-theme='dark']");
    expect(THEME_CSS).toContain('--dv-bg');
  });

  it('overrides shiki colours in dark mode', () =>
  {
    expect(THEME_CSS).toContain('--shiki-dark');
  });
});

describe('renderStandaloneHtml', () =>
{
  const options = {
    bodyHtml: '<h1>Doc</h1><p>Body text</p>',
    title: 'My Doc',
    theme: 'dark' as const
  };

  it('produces a complete standalone document', () =>
  {
    const html = renderStandaloneHtml(options);
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain('<p>Body text</p>');
    expect(html).toContain('<title>My Doc</title>');
  });

  it('applies the requested theme', () =>
  {
    const html = renderStandaloneHtml(options);
    expect(html).toContain('data-theme="dark"');
  });

  it('inlines the theme CSS so the file is self-contained', () =>
  {
    const html = renderStandaloneHtml(options);
    expect(html).toContain('--dv-bg');
    expect(html).not.toContain('<link');
  });

  it('escapes HTML in the title', () =>
  {
    const html = renderStandaloneHtml({ ...options, title: 'a <b> & "c"' });
    expect(html).toContain('<title>a &lt;b&gt; &amp; &quot;c&quot;</title>');
  });
});
