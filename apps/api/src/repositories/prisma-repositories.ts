import type {
  Prisma,
  PrismaClient,
  Analysis,
  Mistake,
  Submission,
  TrainingItem,
} from '@prisma/client';
import { toPrismaCategory } from '../domain/category.js';
import type { SanitizedMistake } from '../domain/training-validation.js';
import type {
  AnalysisRepository,
  MistakeRepository,
  RepositoryBundle,
  RepositoryContext,
  SubmissionRepository,
  TrainingItemRepository,
} from './contracts.js';

type DbClient = PrismaClient | Prisma.TransactionClient;

class PrismaSubmissionRepository implements SubmissionRepository {
  constructor(private readonly db: DbClient) {}

  create(input: { text: string; language: string }): Promise<Submission> {
    return this.db.submission.create({ data: input });
  }

  findById(id: string): Promise<Submission | null> {
    return this.db.submission.findUnique({ where: { id } });
  }

  findDetail(id: string) {
    return this.db.submission.findUnique({
      where: { id },
      include: { analyses: { orderBy: { createdAt: 'desc' }, include: { mistakes: true } } },
    });
  }

  list(input: { limit: number; cursor?: string }) {
    return this.db.submission.findMany({
      take: input.limit + 1,
      ...(input.cursor === undefined ? {} : { skip: 1, cursor: { id: input.cursor } }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { analyses: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
  }
}

class PrismaAnalysisRepository implements AnalysisRepository {
  constructor(private readonly db: DbClient) {}

  createPending(submissionId: string): Promise<Analysis> {
    return this.db.analysis.create({ data: { submissionId, status: 'PENDING' } });
  }

  complete(input: {
    id: string;
    detectedLanguage: string;
    overallFeedback: string;
    correctedText: string;
    styleFeedback: string[];
    provider: string;
    model: string;
    rawResponse?: string;
  }): Promise<Analysis> {
    return this.db.analysis.update({
      where: { id: input.id },
      data: {
        status: 'COMPLETED',
        detectedLanguage: input.detectedLanguage,
        overallFeedback: input.overallFeedback,
        correctedText: input.correctedText,
        styleFeedback: JSON.stringify(input.styleFeedback),
        provider: input.provider,
        model: input.model,
        ...(input.rawResponse === undefined ? {} : { rawResponse: input.rawResponse }),
        errorMessage: null,
      },
    });
  }

  fail(id: string, errorMessage: string): Promise<Analysis> {
    return this.db.analysis.update({ where: { id }, data: { status: 'FAILED', errorMessage } });
  }
}

class PrismaMistakeRepository implements MistakeRepository {
  constructor(private readonly db: DbClient) {}

  create(input: {
    analysisId: string;
    language: string;
    mistake: SanitizedMistake;
  }): Promise<Mistake> {
    const { mistake } = input;
    const training = mistake.trainingOptions;
    return this.db.mistake.create({
      data: {
        analysisId: input.analysisId,
        original: mistake.original,
        correct: mistake.correct,
        normalizedOriginal: mistake.normalizedOriginal,
        normalizedCorrect: mistake.normalizedCorrect,
        explanation: mistake.explanation,
        category: toPrismaCategory(mistake.category),
        ...(mistake.originalSentence === undefined
          ? {}
          : { originalSentence: mistake.originalSentence }),
        trainingOriginal: training?.originalOption ?? null,
        trainingCorrect: training?.correctOption ?? null,
        distractorOne: training?.distractors[0] ?? mistake.distractors?.[0] ?? null,
        distractorTwo: training?.distractors[1] ?? mistake.distractors?.[1] ?? null,
        trainingReason: mistake.trainingReason,
        trainable: mistake.trainable,
      },
    });
  }

  async attachTrainingItem(mistakeId: string, trainingItemId: string): Promise<void> {
    await this.db.mistake.update({ where: { id: mistakeId }, data: { trainingItemId } });
  }
}

class PrismaTrainingItemRepository implements TrainingItemRepository {
  constructor(private readonly db: DbClient) {}

  async findNextItems(input: {
    language?: string;
    limit: number;
    now: Date;
  }): Promise<TrainingItem[]> {
    const items = await this.db.trainingItem.findMany({
      where: {
        active: true,
        exerciseType: 'CONTEXT',
        category: { not: 'CAPITALIZATION' },
        ...(input.language === undefined ? {} : { language: input.language }),
        OR: [{ nextPracticeAt: null }, { nextPracticeAt: { lte: input.now } }],
      },
      take: Math.max(input.limit * 4, input.limit),
    });
    return items
      .sort((left, right) => {
        if (left.timesSeen === 0 && right.timesSeen !== 0) return -1;
        if (right.timesSeen === 0 && left.timesSeen !== 0) return 1;
        const leftAccuracy = left.timesSeen === 0 ? 0 : left.timesCorrect / left.timesSeen;
        const rightAccuracy = right.timesSeen === 0 ? 0 : right.timesCorrect / right.timesSeen;
        if (leftAccuracy !== rightAccuracy) return leftAccuracy - rightAccuracy;
        return (left.lastPracticedAt?.getTime() ?? 0) - (right.lastPracticedAt?.getTime() ?? 0);
      })
      .slice(0, input.limit);
  }

  findById(id: string): Promise<TrainingItem | null> {
    return this.db.trainingItem.findUnique({ where: { id } });
  }

  async createOrMergeFromMistake(input: {
    language: string;
    mistake: SanitizedMistake;
  }): Promise<{ item: TrainingItem; created: boolean }> {
    const training = input.mistake.trainingOptions;
    if (!input.mistake.trainable || training === undefined) {
      throw new Error('A training item requires validated contextual options.');
    }
    const key = {
      language_normalizedOriginal_normalizedCorrect: {
        language: input.language,
        normalizedOriginal: input.mistake.normalizedOriginal,
        normalizedCorrect: input.mistake.normalizedCorrect,
      },
    };
    const exerciseData = {
      category: toPrismaCategory(input.mistake.category),
      exerciseType: 'CONTEXT',
      originalForm: training.originalOption,
      correctForm: training.correctOption,
      distractorOne: training.distractors[0],
      distractorTwo: training.distractors[1],
    };
    const existing = await this.db.trainingItem.findUnique({ where: key });
    if (existing !== null) {
      const item = await this.db.trainingItem.update({
        where: { id: existing.id },
        data: { active: true, ...exerciseData },
      });
      return { item, created: false };
    }
    const item = await this.db.trainingItem.create({
      data: {
        language: input.language,
        ...exerciseData,
        normalizedOriginal: input.mistake.normalizedOriginal,
        normalizedCorrect: input.mistake.normalizedCorrect,
      },
    });
    return { item, created: true };
  }

  async recordAttempt(input: {
    trainingItemId: string;
    selectedOption: string;
    wasCorrect: boolean;
    practicedAt: Date;
  }): Promise<TrainingItem> {
    const nextPracticeAt = new Date(input.practicedAt);
    nextPracticeAt.setHours(nextPracticeAt.getHours() + (input.wasCorrect ? 24 : 1));
    await this.db.trainingAttempt.create({
      data: {
        trainingItemId: input.trainingItemId,
        selectedOption: input.selectedOption,
        wasCorrect: input.wasCorrect,
      },
    });
    return this.db.trainingItem.update({
      where: { id: input.trainingItemId },
      data: {
        timesSeen: { increment: 1 },
        ...(input.wasCorrect
          ? { timesCorrect: { increment: 1 } }
          : { timesIncorrect: { increment: 1 } }),
        lastPracticedAt: input.practicedAt,
        nextPracticeAt,
      },
    });
  }

  async getStats(language?: string) {
    const where = language === undefined ? {} : { language };
    const contextualWhere = {
      ...where,
      exerciseType: 'CONTEXT',
      category: { not: 'CAPITALIZATION' as const },
    };
    const [activeItems, attempts, recentlyPractised] = await Promise.all([
      this.db.trainingItem.count({
        where: { ...contextualWhere, active: true },
      }),
      this.db.trainingAttempt.findMany({
        where: { trainingItem: contextualWhere },
        select: { wasCorrect: true },
      }),
      this.db.trainingItem.count({
        where: {
          ...contextualWhere,
          lastPracticedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);
    const correctAttempts = attempts.filter((attempt) => attempt.wasCorrect).length;
    return {
      activeItems,
      totalAttempts: attempts.length,
      correctAttempts,
      incorrectAttempts: attempts.length - correctAttempts,
      recentlyPractised,
    };
  }
}

function createBundle(db: DbClient): RepositoryBundle {
  return {
    submissions: new PrismaSubmissionRepository(db),
    analyses: new PrismaAnalysisRepository(db),
    mistakes: new PrismaMistakeRepository(db),
    trainingItems: new PrismaTrainingItemRepository(db),
  };
}

export class PrismaRepositoryContext implements RepositoryContext {
  readonly repositories: RepositoryBundle;

  constructor(private readonly prisma: PrismaClient) {
    this.repositories = createBundle(prisma);
  }

  transaction<T>(work: (repositories: RepositoryBundle) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((transaction) => work(createBundle(transaction)));
  }
}
