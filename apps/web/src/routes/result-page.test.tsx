import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/render.js';
import { ResultPage } from './result-page.js';

afterEach(() => vi.unstubAllGlobals());

describe('ResultPage', () => {
  it('renders feedback, corrected text, and trainable mistakes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              id: 'submission-1',
              text: 'Det var interesant.',
              language: 'da',
              createdAt: new Date().toISOString(),
              latestAnalysis: {
                submissionId: 'submission-1',
                analysisId: 'analysis-1',
                status: 'completed',
                trainingItemsCreated: 1,
                analysis: {
                  detectedLanguage: 'da',
                  overallFeedback: 'Du forklarer din tanke tydeligt.',
                  styleFeedback: ['Prøv en længere afslutning.'],
                  correctedText: 'Det var interessant.',
                  mistakes: [
                    {
                      id: 'mistake-1',
                      original: 'interesant',
                      correct: 'interessant',
                      explanation: 'Ordet staves med dobbelt s.',
                      category: 'spelling',
                      trainable: true,
                      distractors: ['interressant', 'intressant'],
                      addedToTraining: true,
                    },
                  ],
                },
              },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
      ),
    );
    renderWithProviders(
      <Routes>
        <Route path="/result/:id" element={<ResultPage />} />
      </Routes>,
      ['/result/submission-1'],
    );
    expect(await screen.findByText('Du forklarer din tanke tydeligt.')).toBeInTheDocument();
    expect(screen.getByText('Det var interessant.')).toBeInTheDocument();
    expect(screen.getByText('Tilføjet til træning')).toBeInTheDocument();
  });
});
