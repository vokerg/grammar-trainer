import { describe, expect, it } from 'vitest';
import { canonicalOptions, sanitizeMistake, shuffleOptions } from './training-validation.js';

const baseMistake = {
  original: 'interesant',
  correct: 'interessant',
  explanation: 'Dobbelt s.',
  category: 'spelling' as const,
  trainable: true,
  distractors: ['interressant', 'intressant'] as [string, string],
};

describe('training validation', () => {
  it('keeps four unique plausible options trainable', () => {
    expect(sanitizeMistake(baseMistake, 'da').trainable).toBe(true);
  });

  it('downgrades duplicate distractors', () => {
    expect(
      sanitizeMistake({ ...baseMistake, distractors: ['interessant', 'intressant'] }, 'da')
        .trainable,
    ).toBe(false);
  });

  it('does not train punctuation-only mistakes', () => {
    expect(sanitizeMistake({ ...baseMistake, category: 'punctuation' }, 'da').trainable).toBe(false);
  });

  it('shuffles without changing the option set', () => {
    const options = canonicalOptions({
      originalForm: 'a',
      correctForm: 'b',
      distractorOne: 'c',
      distractorTwo: 'd',
    });
    expect(new Set(shuffleOptions(options, () => 0))).toEqual(new Set(options));
  });
});
