import { normalizeTrainingText, type GrammarAnalysis, type GrammarMistake } from '@grammar/shared';

export type SanitizedMistake = GrammarMistake & {
  normalizedOriginal: string;
  normalizedCorrect: string;
};

function isReasonableLength(values: string[]): boolean {
  if (values.some((value) => value.trim().length === 0 || value.length > 60)) return false;
  const lengths = values.map((value) => value.trim().length);
  const shortest = Math.max(1, Math.min(...lengths));
  return Math.max(...lengths) / shortest <= 4;
}

export function sanitizeMistake(mistake: GrammarMistake, language: string): SanitizedMistake {
  const normalizedOriginal = normalizeTrainingText(mistake.original, language);
  const normalizedCorrect = normalizeTrainingText(mistake.correct, language);
  const normalizedOptions = [
    normalizedOriginal,
    normalizedCorrect,
    ...mistake.distractors.map((value) => normalizeTrainingText(value, language)),
  ];
  const unique = new Set(normalizedOptions);
  const trainable =
    mistake.trainable &&
    mistake.category !== 'punctuation' &&
    unique.size === 4 &&
    normalizedOriginal !== normalizedCorrect &&
    isReasonableLength([mistake.original, mistake.correct, ...mistake.distractors]);

  return { ...mistake, trainable, normalizedOriginal, normalizedCorrect };
}

export function sanitizeAnalysis(
  analysis: GrammarAnalysis,
  language: string,
): GrammarAnalysis & {
  mistakes: SanitizedMistake[];
} {
  return {
    ...analysis,
    mistakes: analysis.mistakes.map((mistake) => sanitizeMistake(mistake, language)),
  };
}

export function canonicalOptions(item: {
  originalForm: string;
  correctForm: string;
  distractorOne: string;
  distractorTwo: string;
}): [string, string, string, string] {
  return [item.originalForm, item.correctForm, item.distractorOne, item.distractorTwo];
}

export function shuffleOptions(
  options: readonly [string, string, string, string],
  random: () => number = Math.random,
): [string, string, string, string] {
  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = shuffled[index];
    const swap = shuffled[swapIndex];
    if (current === undefined || swap === undefined) continue;
    shuffled[index] = swap;
    shuffled[swapIndex] = current;
  }
  return shuffled as [string, string, string, string];
}
