import { randomUUID } from 'node:crypto';
import {
  normalizeTrainingText,
  type MistakeCategory,
  type SupportedLanguage,
  type TrainingSessionResponse,
  type VocabularyResponse,
} from '@grammar/shared';
import { fromPrismaCategory } from '../domain/category.js';
import { AppError } from '../domain/errors.js';
import { canonicalOptions, shuffleOptions } from '../domain/training-validation.js';
import type { RepositoryContext } from '../repositories/contracts.js';

const contextPrompts: Record<SupportedLanguage, string> = {
  da: 'Vælg den korrekte sætning',
  en: 'Choose the correct sentence',
  de: 'Wähle den richtigen Satz',
  ru: 'Выбери правильное предложение',
};

const formPrompts: Record<SupportedLanguage, string> = {
  da: 'Vælg den korrekte form',
  en: 'Choose the correct form',
  de: 'Wähle die richtige Form',
  ru: 'Выбери правильную форму',
};

function promptFor(language: string, exerciseType: string): string {
  const selected = (language in contextPrompts ? language : 'en') as SupportedLanguage;
  return exerciseType === 'CONTEXT' ? contextPrompts[selected] : formPrompts[selected];
}

export class GetTrainingSessionService {
  constructor(private readonly context: RepositoryContext) {}

  async execute(input: {
    language?: string;
    submissionId?: string;
  }): Promise<TrainingSessionResponse> {
    const items = await this.context.repositories.trainingItems.findSessionItems({
      ...(input.language === undefined ? {} : { language: input.language }),
      ...(input.submissionId === undefined ? {} : { submissionId: input.submissionId }),
    });
    return {
      sessionId: randomUUID(),
      items: items.map((item) => ({
        id: item.id,
        category: fromPrismaCategory(item.category) as MistakeCategory,
        prompt: promptFor(item.language, item.exerciseType),
        exerciseType: item.exerciseType === 'CONTEXT' ? 'context' : 'form',
        options: shuffleOptions(canonicalOptions(item)),
      })),
    };
  }
}

export class AnswerTrainingItemService {
  constructor(private readonly context: RepositoryContext) {}

  async execute(input: { trainingItemId: string; selectedOption: string }) {
    return this.context.transaction(async (repositories) => {
      const item = await repositories.trainingItems.findById(input.trainingItemId);
      if (item === null) {
        throw new AppError('TRAINING_ITEM_NOT_FOUND', 'Training item not found.', 404);
      }
      const options = canonicalOptions(item);
      const normalizedSelection = normalizeTrainingText(input.selectedOption, item.language);
      const allowed = options.some(
        (option) => normalizeTrainingText(option, item.language) === normalizedSelection,
      );
      if (!allowed) {
        throw new AppError(
          'INVALID_TRAINING_OPTION',
          'The selected answer is not one of the available options.',
          400,
        );
      }
      const wasCorrect =
        normalizedSelection === normalizeTrainingText(item.correctForm, item.language);
      const updated = await repositories.trainingItems.recordAttempt({
        trainingItemId: item.id,
        selectedOption: input.selectedOption,
        wasCorrect,
        practicedAt: new Date(),
      });
      return {
        wasCorrect,
        correctAnswer: item.correctForm,
        selectedOption: input.selectedOption,
        stats: {
          timesSeen: updated.timesSeen,
          timesCorrect: updated.timesCorrect,
          timesIncorrect: updated.timesIncorrect,
        },
      };
    });
  }
}

export class GetTrainingStatsService {
  constructor(private readonly context: RepositoryContext) {}

  async execute(language?: string) {
    const stats = await this.context.repositories.trainingItems.getStats(language);
    return {
      ...stats,
      accuracy: stats.totalAttempts === 0 ? 0 : stats.correctAttempts / stats.totalAttempts,
    };
  }
}

export class GetVocabularyService {
  constructor(private readonly context: RepositoryContext) {}

  async execute(language?: string): Promise<VocabularyResponse> {
    const items = await this.context.repositories.vocabulary.list({
      ...(language === undefined ? {} : { language }),
    });
    return {
      items: items.map((item) => ({
        id: item.id,
        category: fromPrismaCategory(item.category) as MistakeCategory,
        original: item.original,
        correct: item.correct,
        timesSeen: 0,
        timesCorrect: 0,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}

export class DeleteVocabularyItemService {
  constructor(private readonly context: RepositoryContext) {}

  async execute(trainingItemId: string): Promise<void> {
    const item = await this.context.repositories.vocabulary.findById(trainingItemId);
    if (item === null) {
      throw new AppError('TRAINING_ITEM_NOT_FOUND', 'Training item not found.', 404);
    }
    await this.context.repositories.vocabulary.deactivate(trainingItemId);
  }
}
