import { describe, expect, it } from 'vitest';
import { canonicalOptions, sanitizeMistake, shuffleOptions } from './training-validation.js';

const baseMistake = {
  original: 'interesant',
  correct: 'interessant',
  explanation: 'Dobbelt s.',
  category: 'spelling' as const,
  originalSentence: 'Det var interesant.',
  trainable: true,
  trainingOptions: {
    originalOption: 'Det var interesant.',
    correctOption: 'Det var interessant.',
    distractors: ['Det var interressant.', 'Det var intressant.'] as [string, string],
  },
};

describe('training validation', () => {
  it('keeps four unique contextual options trainable', () => {
    expect(sanitizeMistake(baseMistake, 'da').trainable).toBe(true);
  });

  it('downgrades duplicate contextual distractors', () => {
    const result = sanitizeMistake(
      {
        ...baseMistake,
        trainingOptions: {
          ...baseMistake.trainingOptions,
          distractors: ['Det var interessant.', 'Det var intressant.'],
        },
      },
      'da',
    );
    expect(result.trainable).toBe(false);
    expect(result.trainingReason).toBe('invalid-options');
  });

  it('allows punctuation when sentence options are contextual and unique', () => {
    const result = sanitizeMistake(
      {
        ...baseMistake,
        original: 'Hej Peter',
        correct: 'Hej, Peter',
        category: 'punctuation',
        trainingOptions: {
          originalOption: 'Hej Peter, kom her.',
          correctOption: 'Hej, Peter, kom her.',
          distractors: ['Hej Peter kom, her.', 'Hej; Peter, kom her.'],
        },
      },
      'da',
    );
    expect(result.trainable).toBe(true);
  });

  it('excludes capitalization from this exercise type', () => {
    const result = sanitizeMistake({ ...baseMistake, category: 'capitalization' }, 'da');
    expect(result.trainable).toBe(false);
    expect(result.trainingReason).toBe('capitalization-excluded');
  });

  it('shuffles without changing the option set', () => {
    const options = canonicalOptions({
      originalForm: 'a sentence',
      correctForm: 'b sentence',
      distractorOne: 'c sentence',
      distractorTwo: 'd sentence',
    });
    expect(new Set(shuffleOptions(options, () => 0))).toEqual(new Set(options));
  });
});
