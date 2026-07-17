import type { Analysis, Mistake, Submission } from '@prisma/client';
import type { SubmissionAnalysisResponse, SubmissionDetail } from '@grammar/shared';
import { fromPrismaCategory } from '../domain/category.js';
import { AppError } from '../domain/errors.js';
import type { RepositoryContext } from '../repositories/contracts.js';

function parseStyleFeedback(value: string | null): string[] {
  if (value === null) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function mapAnalysis(
  submissionId: string,
  analysis: Analysis & { mistakes: Mistake[] },
): SubmissionAnalysisResponse {
  const status = analysis.status.toLowerCase() as 'completed' | 'failed' | 'pending';
  if (analysis.status !== 'COMPLETED') {
    return { submissionId, analysisId: analysis.id, status, trainingItemsCreated: 0 };
  }
  return {
    submissionId,
    analysisId: analysis.id,
    status,
    analysis: {
      detectedLanguage: analysis.detectedLanguage ?? '',
      overallFeedback: analysis.overallFeedback ?? '',
      styleFeedback: parseStyleFeedback(analysis.styleFeedback),
      correctedText: analysis.correctedText ?? '',
      mistakes: analysis.mistakes.map((mistake) => ({
        id: mistake.id,
        original: mistake.original,
        correct: mistake.correct,
        explanation: mistake.explanation,
        category: fromPrismaCategory(mistake.category),
        ...(mistake.originalSentence === null ? {} : { originalSentence: mistake.originalSentence }),
        trainable: mistake.trainable,
        distractors: [mistake.distractorOne ?? '', mistake.distractorTwo ?? ''],
        addedToTraining: mistake.trainingItemId !== null,
      })),
    },
    trainingItemsCreated: analysis.mistakes.filter((mistake) => mistake.trainingItemId !== null).length,
  };
}

export class GetSubmissionService {
  constructor(private readonly context: RepositoryContext) {}

  async execute(id: string): Promise<SubmissionDetail> {
    const submission = await this.context.repositories.submissions.findDetail(id);
    if (submission === null) throw new AppError('SUBMISSION_NOT_FOUND', 'Submission not found.', 404);
    const latest = submission.analyses[0];
    return {
      id: submission.id,
      text: submission.text,
      language: submission.language as SubmissionDetail['language'],
      createdAt: submission.createdAt.toISOString(),
      latestAnalysis: latest === undefined ? null : mapAnalysis(submission.id, latest),
    };
  }
}

export class ListSubmissionsService {
  constructor(private readonly context: RepositoryContext) {}

  async execute(input: { limit: number; cursor?: string }) {
    const records = await this.context.repositories.submissions.list(input);
    const hasMore = records.length > input.limit;
    const page = records.slice(0, input.limit);
    return {
      items: page.map((submission: Submission & { analyses: Analysis[] }) => ({
        id: submission.id,
        textPreview: submission.text.length > 120 ? `${submission.text.slice(0, 117)}…` : submission.text,
        language: submission.language,
        createdAt: submission.createdAt.toISOString(),
        status:
          submission.analyses[0] === undefined
            ? null
            : (submission.analyses[0].status.toLowerCase() as 'completed' | 'failed' | 'pending'),
      })),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }
}
