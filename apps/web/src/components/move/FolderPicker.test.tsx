import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockFetch, renderWithProviders } from '../../test/helpers.js';
import { DocTree } from '../tree/DocTree.js';

const guides = {
  id: 'dir-1',
  parentId: null,
  name: 'guides',
  createdAt: '2026-07-14'
};

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

describe('moving documents into folders', () =>
{
  it('moves a document via the row menu folder picker', async () =>
  {
    const fetchMock = mockFetch({
      'GET /api/settings': { settings: { theme: 'system' } },
      'GET /api/auth/me': { authenticated: true },
      'GET /api/tree': {
        tree: [
          { type: 'directory', directory: guides, children: [] },
          { type: 'document', document: doc }
        ]
      },
      'PATCH /api/documents/doc-1': { document: { ...doc, directoryId: 'dir-1' } }
    });
    renderWithProviders(<DocTree />);

    await screen.findByText('Notes');
    await userEvent.click(screen.getAllByRole('button', { name: /more actions/i })[1]);
    await userEvent.click(screen.getByRole('menuitem', { name: /move to folder/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /guides/i }));

    const patchCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === 'PATCH'
    );
    expect(patchCall).toBeDefined();
    expect(JSON.parse(String((patchCall![1] as RequestInit).body))).toEqual({
      directoryId: 'dir-1'
    });
  });

  it('disables the folder the document is already in', async () =>
  {
    mockFetch({
      'GET /api/settings': { settings: { theme: 'system' } },
      'GET /api/auth/me': { authenticated: true },
      'GET /api/tree': {
        tree: [
          {
            type: 'directory',
            directory: guides,
            children: [{ type: 'document', document: { ...doc, directoryId: 'dir-1' } }]
          }
        ]
      }
    });
    renderWithProviders(<DocTree />);

    await screen.findByText('Notes');
    await userEvent.click(screen.getAllByRole('button', { name: /more actions/i })[1]);
    await userEvent.click(screen.getByRole('menuitem', { name: /move to folder/i }));

    expect(screen.getByRole('menuitem', { name: /guides/i })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: /top level/i })).toBeEnabled();
  });
});
