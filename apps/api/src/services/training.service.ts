import { randomUUID } from 'node:crypto';
import { normalizeTrainingText, type MistakeCategory, type TrainingSessionResponse } from '@grammar/shared';
import { fromPrismaCategory } from '../domain/category.js';
import { AppError } from '../domain/errors.js';
import { canonicalOptions, shuffleOptions } from '../domain/training-validation.js';
import type { RepositoryContext } from '../repositories/contracts.js';

export class GetTrainingSessionService {
  constructor(private readonly context: RepositoryContext) {}

  async execute(input: { limit: number; language?: string }): Promise<TrainingSessionResponse> {
    const items = await this.context.repositories.trainingItems.findNextItems({
      limit: input.limit,
      now: new Date(),
      ...(input.language === undefined ? {} : { language: input.language }),
    });
    return {
      sessionId: randomUUID(),
      items: items.map((item) => ({
        id: item.id,
        category: fromPrismaCategory(item.category) as MistakeCategory,
        prompt: 'Vælg den korrekte form',
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
      const wasCorrect = normalizedSelection === item.normalizedCorrect;
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
