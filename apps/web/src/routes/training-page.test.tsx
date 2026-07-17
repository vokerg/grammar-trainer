import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/render.js';
import { TrainingPage } from './training-page.js';

afterEach(() => vi.unstubAllGlobals());

function mockTrainingFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/answer')) {
        const selected = JSON.parse(String(init?.body)) as { selectedOption: string };
        return new Response(
          JSON.stringify({
            wasCorrect: selected.selectedOption === 'interessant',
            correctAnswer: 'interessant',
            selectedOption: selected.selectedOption,
            stats: {
              timesSeen: 1,
              timesCorrect: selected.selectedOption === 'interessant' ? 1 : 0,
              timesIncorrect: selected.selectedOption === 'interessant' ? 0 : 1,
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (url.includes('/stats')) {
        return new Response(
          JSON.stringify({
            activeItems: 1,
            totalAttempts: 0,
            correctAttempts: 0,
            incorrectAttempts: 0,
            accuracy: 0,
            recentlyPractised: 0,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          sessionId: 'session-1',
          items: [
            {
              id: 'item-1',
              category: 'spelling',
              prompt: 'Vælg den korrekte form',
              options: ['interesant', 'interessant', 'interressant', 'intressant'],
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }),
  );
}

describe('TrainingPage', () => {
  it('submits an answer and shows supportive feedback', async () => {
    mockTrainingFetch();
    const user = userEvent.setup();
    renderWithProviders(<TrainingPage />);
    await user.click(await screen.findByRole('button', { name: 'Svar 2: interessant' }));
    expect(await screen.findByText(/Ja — godt set/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Næste ord' })).toBeEnabled();
  });

  it('supports number-key selection', async () => {
    mockTrainingFetch();
    renderWithProviders(<TrainingPage />);
    await screen.findByRole('button', { name: 'Svar 1: interesant' });
    fireEvent.keyDown(window, { key: '1' });
    expect(await screen.findByText(/Godt forsøgt/)).toBeInTheDocument();
  });
});
