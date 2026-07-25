import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/render.js';
import { VocabularyPage } from './vocabulary-page.js';

afterEach(() => vi.unstubAllGlobals());

describe('VocabularyPage', () => {
  it('lists saved corrections and removes one from the pool', async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      return new Response(
        JSON.stringify({
          items: [
            {
              id: 'item-1',
              category: 'spelling',
              original: 'Det var interesant.',
              correct: 'Det var interessant.',
              timesSeen: 2,
              timesCorrect: 1,
              createdAt: '2026-07-19T12:00:00.000Z',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup();
    renderWithProviders(<VocabularyPage />);

    expect(await screen.findByText('Det var interessant.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fjern' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/vocabulary/item-1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
