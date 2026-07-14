import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockFetch, renderWithProviders } from '../../test/helpers.js';
import { Sidebar } from './Sidebar.js';

describe('Sidebar', () =>
{
  it('collapses and expands', async () =>
  {
    mockFetch({
      'GET /api/tree': { tree: [] },
      'GET /api/settings': { settings: { theme: 'system' } }
    });
    renderWithProviders(<Sidebar />);

    expect(await screen.findByText('doc-viewer')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }));
    expect(screen.queryByText('doc-viewer')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));
    expect(screen.getByText('doc-viewer')).toBeInTheDocument();
  });
});
