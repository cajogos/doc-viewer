import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { mockFetch, renderWithProviders } from '../test/helpers.js';
import { DocumentPage } from './DocumentPage.js';

const doc = {
  id: 'doc-1',
  directoryId: null,
  title: 'Notes',
  filename: 'notes.md',
  relPath: 'notes.md',
  size: 10,
  missing: false,
  createdAt: '2026-07-14',
  updatedAt: '2026-07-14',
  tags: []
};

function renderPage(): void
{
  mockFetch({
    'GET /api/settings': { settings: { theme: 'system' } },
    'GET /api/tree': { tree: [] },
    'GET /api/tags': { tags: [] },
    'GET /api/documents/doc-1': { document: doc, html: '<p>reading body</p>' }
  });
  renderWithProviders(
    <Routes>
      <Route path="/doc/:id" element={<DocumentPage />} />
    </Routes>,
    { route: '/doc/doc-1' }
  );
}

describe('DocumentPage expand mode', () =>
{
  it('expands the reading area and persists the choice', async () =>
  {
    renderPage();
    await screen.findByText('reading body');

    const toggle = screen.getByRole('button', { name: /expand/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.querySelector('.doc-scroll')).toHaveAttribute('data-expanded', 'false');

    await userEvent.click(toggle);

    expect(screen.getByRole('button', { name: /collapse/i })).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.doc-scroll')).toHaveAttribute('data-expanded', 'true');
    expect(localStorage.getItem('dv-expanded')).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: /collapse/i }));
    expect(document.querySelector('.doc-scroll')).toHaveAttribute('data-expanded', 'false');
    expect(localStorage.getItem('dv-expanded')).toBe('false');
  });

  it('starts expanded when previously enabled', async () =>
  {
    localStorage.setItem('dv-expanded', 'true');
    renderPage();
    await screen.findByText('reading body');

    expect(document.querySelector('.doc-scroll')).toHaveAttribute('data-expanded', 'true');
    expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
  });
});
