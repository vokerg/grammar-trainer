import {
  normalizeTrainingText,
  type GrammarAnalysis,
  type GrammarMistake,
  type TrainingOptions,
  type TrainingReason,
} from '@grammar/shared';

export type SanitizedMistake = GrammarMistake & {
  normalizedOriginal: string;
  normalizedCorrect: string;
  trainingReason: Exclude<TrainingReason, 'added'>;
};

function replaceFirst(value: string, target: string, replacement: string): string | null {
  const index = value.indexOf(target);
  if (index < 0) return null;
  return `${value.slice(0, index)}${replacement}${value.slice(index + target.length)}`;
}

function buildLegacyContext(mistake: GrammarMistake): TrainingOptions | undefined {
  if (mistake.trainingOptions !== undefined) return mistake.trainingOptions;
  if (mistake.originalSentence === undefined || mistake.distractors === undefined) return undefined;
  const correctOption = replaceFirst(mistake.originalSentence, mistake.original, mistake.correct);
  const distractorOne = replaceFirst(
    mistake.originalSentence,
    mistake.original,
    mistake.distractors[0],
  );
  const distractorTwo = replaceFirst(
    mistake.originalSentence,
    mistake.original,
    mistake.distractors[1],
  );
  if (correctOption === null || distractorOne === null || distractorTwo === null) return undefined;
  return {
    originalOption: mistake.originalSentence,
    correctOption,
    distractors: [distractorOne, distractorTwo],
  };
}

function hasSharedCarrierContext(
  options: TrainingOptions,
  original: string,
  correct: string,
): boolean {
  const originalIndex = options.originalOption.indexOf(original);
  if (originalIndex < 0) return false;
  const prefix = options.originalOption.slice(0, originalIndex);
  const suffix = options.originalOption.slice(originalIndex + original.length);
  const carrier = `${prefix} ${suffix}`.trim();
  if (carrier.split(/\s+/).filter(Boolean).length === 0) return false;

  const expectedValues = [options.correctOption, ...options.distractors];
  return (
    options.originalOption.indexOf(original, originalIndex + original.length) < 0 &&
    options.correctOption === `${prefix}${correct}${suffix}` &&
    expectedValues.every((value) => {
      if (!value.startsWith(prefix) || !value.endsWith(suffix)) return false;
      const changedPart = value.slice(prefix.length, value.length - suffix.length);
      return changedPart.trim().length > 0;
    })
  );
}

function contextIsReasonable(
  options: TrainingOptions,
  language: string,
  original: string,
  correct: string,
): boolean {
  const values = [options.originalOption, options.correctOption, ...options.distractors];
  if (values.some((value) => value.trim().length < 3 || value.length > 500)) return false;
  if (values.some((value) => value.trim().split(/\s+/).length < 2)) return false;
  const normalized = values.map((value) => normalizeTrainingText(value, language));
  if (new Set(normalized).size !== 4) return false;
  const lengths = values.map((value) => value.trim().length);
  const shortest = Math.max(1, Math.min(...lengths));
  return (
    Math.max(...lengths) / shortest <= 1.8 && hasSharedCarrierContext(options, original, correct)
  );
}

export function sanitizeMistake(mistake: GrammarMistake, language: string): SanitizedMistake {
  const normalizedOriginal = normalizeTrainingText(mistake.original, language);
  const normalizedCorrect = normalizeTrainingText(mistake.correct, language);
  const trainingOptions = buildLegacyContext(mistake);

  let trainable = false;
  let trainingReason: Exclude<TrainingReason, 'added'> = 'model-not-trainable';
  if (mistake.category === 'capitalization') {
    trainingReason = 'capitalization-excluded';
  } else if (!mistake.trainable) {
    trainingReason = 'model-not-trainable';
  } else if (trainingOptions === undefined) {
    trainingReason = 'missing-context';
  } else if (
    normalizedOriginal === normalizedCorrect ||
    !contextIsReasonable(trainingOptions, language, mistake.original, mistake.correct)
  ) {
    trainingReason = 'invalid-options';
  } else {
    trainable = true;
  }

  return {
    ...mistake,
    ...(trainingOptions === undefined ? {} : { trainingOptions }),
    trainable,
    trainingReason,
    normalizedOriginal,
    normalizedCorrect,
  };
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
