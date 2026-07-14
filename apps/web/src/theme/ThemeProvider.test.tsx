import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppearanceSection } from '../pages/settings/AppearanceSection.js';
import { mockFetch, renderWithProviders } from '../test/helpers.js';

describe('theme switching', () =>
{
  it('applies the selected theme to the document element', async () =>
  {
    mockFetch({
      'GET /api/settings': { settings: { theme: 'system' } },
      'PUT /api/settings': { settings: { theme: 'dark' } }
    });
    renderWithProviders(<AppearanceSection />);

    await userEvent.click(screen.getByRole('radio', { name: /^dark/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('dv-theme')).toBe('dark');
  });
});
