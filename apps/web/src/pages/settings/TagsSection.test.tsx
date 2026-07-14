import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockFetch, renderWithProviders } from '../../test/helpers.js';
import { TagsSection } from './TagsSection.js';

describe('TagsSection', () =>
{
  it('creates a tag', async () =>
  {
    let tags: Array<{ id: string; name: string; color: string }> = [];
    const fetchMock = mockFetch({
      'GET /api/settings': { settings: { theme: 'system' } },
      'GET /api/auth/me': { authenticated: true },
      'GET /api/tags': () => ({ body: { tags } }),
      'POST /api/tags': (init?: RequestInit) =>
      {
        const body = JSON.parse(String(init?.body)) as { name: string; color: string };
        const tag = { id: 'tag-1', ...body };
        tags = [tag];
        return { status: 201, body: { tag } };
      }
    });
    renderWithProviders(<TagsSection />);

    await userEvent.type(screen.getByLabelText('Tag name'), 'urgent');
    await userEvent.click(screen.getByRole('button', { name: /add tag/i }));

    expect(await screen.findByText('urgent')).toBeInTheDocument();
    const createCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === 'POST'
    );
    expect(createCall).toBeDefined();
  });

  it('shows the API error when creation fails', async () =>
  {
    mockFetch({
      'GET /api/settings': { settings: { theme: 'system' } },
      'GET /api/auth/me': { authenticated: true },
      'GET /api/tags': { tags: [] },
      'POST /api/tags': () => ({
        status: 409,
        body: { error: 'A record with that name already exists' }
      })
    });
    renderWithProviders(<TagsSection />);

    await userEvent.type(screen.getByLabelText('Tag name'), 'dup');
    await userEvent.click(screen.getByRole('button', { name: /add tag/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i);
  });
});
