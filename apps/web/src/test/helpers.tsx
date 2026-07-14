import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider.js';

type RouteHandler = (init?: RequestInit) => { status?: number; body: unknown };

/**
 * Stubs global fetch with a "METHOD /url" table. Unmatched requests return
 * an empty success so background queries never explode a test.
 */
export function mockFetch(routes: Record<string, RouteHandler | unknown>): ReturnType<typeof vi.fn>
{
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
  {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';
    const key = `${method} ${url.split('?')[0]}`;
    const handler = routes[key];
    const result =
      typeof handler === 'function'
        ? (handler as RouteHandler)(init)
        : { status: 200, body: handler ?? {} };
    return new Response(JSON.stringify(result.body ?? {}), {
      status: result.status ?? 200,
      headers: { 'content-type': 'application/json' }
    });
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

export function renderWithProviders(ui: React.ReactNode, { route = '/' } = {})
{
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
