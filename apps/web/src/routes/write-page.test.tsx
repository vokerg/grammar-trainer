import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../test/render.js';
import { WritePage } from './write-page.js';

describe('WritePage', () => {
  it('validates short writing and autosaves a useful draft', async () => {
    localStorage.clear();
    const user = userEvent.setup();
    renderWithProviders(<WritePage />);
    const editor = screen.getByLabelText('Din tekst');
    await user.type(editor, 'Hej verden');
    expect(localStorage.getItem('grammar-trainer:draft')).toBe('Hej verden');
    await user.clear(editor);
    await user.type(editor, 'a');
    await user.click(screen.getByRole('button', { name: 'Tjek min tekst' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Skriv mindst 3 tegn.');
  });
});
