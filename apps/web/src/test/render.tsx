import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n.js';

export function renderWithProviders(ui: ReactElement, initialEntries = ['/']): RenderResult {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );
}
