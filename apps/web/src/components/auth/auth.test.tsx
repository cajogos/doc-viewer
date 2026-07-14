import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockFetch, renderWithProviders } from '../../test/helpers.js';
import { AppearanceSection } from '../../pages/settings/AppearanceSection.js';
import { Sidebar } from '../layout/Sidebar.js';
import { DocTree } from '../tree/DocTree.js';

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

describe('authentication UI', () =>
{
  it('signs in through the dialog and switches the sidebar to Sign out', async () =>
  {
    let authenticated = false;
    mockFetch({
      'GET /api/settings': { settings: { theme: 'system' } },
      'GET /api/tree': { tree: [] },
      'GET /api/auth/me': () => ({ body: { authenticated } }),
      'POST /api/auth/login': (init?: RequestInit) =>
      {
        const body = JSON.parse(String(init?.body)) as { password: string };
        if (body.password !== 'secret')
        {
          return { status: 401, body: { error: 'Invalid username or password' } };
        }
        authenticated = true;
        return { status: 200, body: { user: { username: 'admin' } } };
      }
    });
    renderWithProviders(<Sidebar />);

    await userEvent.click(await screen.findByRole('button', { name: /sign in/i }));
    const dialog = within(screen.getByRole('dialog', { name: /sign in/i }));
    await userEvent.type(dialog.getByLabelText(/password/i), 'wrong');
    await userEvent.click(dialog.getByRole('button', { name: /^sign in$/i }));
    expect(await dialog.findByRole('alert')).toHaveTextContent(/invalid/i);

    await userEvent.clear(dialog.getByLabelText(/password/i));
    await userEvent.type(dialog.getByLabelText(/password/i), 'secret');
    await userEvent.click(dialog.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('hides editing affordances in the tree for guests', async () =>
  {
    mockFetch({
      'GET /api/settings': { settings: { theme: 'system' } },
      'GET /api/auth/me': { authenticated: false },
      'GET /api/tree': { tree: [{ type: 'document', document: doc }] }
    });
    renderWithProviders(<DocTree />);

    expect(await screen.findByText('Notes')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /more actions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new folder/i })).not.toBeInTheDocument();
  });

  it('keeps guest theme changes local instead of saving to the server', async () =>
  {
    const fetchMock = mockFetch({
      'GET /api/settings': { settings: { theme: 'system' } },
      'GET /api/auth/me': { authenticated: false },
      'PUT /api/settings': { settings: { theme: 'dark' } }
    });
    renderWithProviders(<AppearanceSection />);

    await userEvent.click(screen.getByRole('radio', { name: /^dark/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    const putCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === 'PUT'
    );
    expect(putCall).toBeUndefined();
  });
});
