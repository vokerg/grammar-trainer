import type { LanguageModelProvider } from '@grammar/llm';
import { LlmError } from '@grammar/llm';
import type { SubmissionAnalysisResponse } from '@grammar/shared';
import { AppError } from '../domain/errors.js';
import { sanitizeAnalysis } from '../domain/training-validation.js';
import type { RepositoryContext } from '../repositories/contracts.js';

export class AnalyzeSubmissionService {
  constructor(
    private readonly context: RepositoryContext,
    private readonly llmProvider: LanguageModelProvider,
  ) {}

  async execute(input: {
    submissionId: string;
    analysisId?: string;
  }): Promise<SubmissionAnalysisResponse> {
    const submission = await this.context.repositories.submissions.findById(input.submissionId);
    if (submission === null) {
      throw new AppError('SUBMISSION_NOT_FOUND', 'Submission not found.', 404);
    }
    const analysisRecord =
      input.analysisId === undefined
        ? await this.context.repositories.analyses.createPending(submission.id)
        : { id: input.analysisId };

    try {
      const providerResult = await this.llmProvider.analyzeText({
        text: submission.text,
        requestedLanguage: submission.language,
      });
      const sanitized = sanitizeAnalysis(providerResult.analysis, submission.language);
      const persisted = await this.context.transaction(async (repositories) => {
        await repositories.analyses.complete({
          id: analysisRecord.id,
          detectedLanguage: sanitized.detectedLanguage,
          overallFeedback: sanitized.overallFeedback,
          correctedText: sanitized.correctedText,
          styleFeedback: sanitized.styleFeedback,
          provider: this.llmProvider.providerName,
          model: this.llmProvider.modelName,
          ...(providerResult.rawResponse === undefined
            ? {}
            : { rawResponse: providerResult.rawResponse }),
        });
        let trainingItemsCreated = 0;
        const mistakes = [];
        for (const mistake of sanitized.mistakes) {
          const savedMistake = await repositories.mistakes.create({
            analysisId: analysisRecord.id,
            language: submission.language,
            mistake,
          });
          const vocabularyEntry = await repositories.vocabulary.createOrFindFromMistake({
            language: submission.language,
            mistake,
          });
          let addedToTraining = false;
          if (mistake.trainable) {
            const training = await repositories.trainingItems.createOrMergeFromMistake({
              language: submission.language,
              mistake,
              vocabularyEntryId: vocabularyEntry.id,
            });
            await repositories.mistakes.attachTrainingItem(savedMistake.id, training.item.id);
            trainingItemsCreated += training.created ? 1 : 0;
            addedToTraining = true;
          }
          mistakes.push({
            id: savedMistake.id,
            original: mistake.original,
            correct: mistake.correct,
            explanation: mistake.explanation,
            category: mistake.category,
            ...(mistake.originalSentence === undefined
              ? {}
              : { originalSentence: mistake.originalSentence }),
            ...(mistake.trainingOptions === undefined
              ? {}
              : { trainingOptions: mistake.trainingOptions }),
            ...(mistake.distractors === undefined ? {} : { distractors: mistake.distractors }),
            trainable: mistake.trainable,
            trainingReason: addedToTraining ? ('added' as const) : mistake.trainingReason,
            addedToTraining,
          });
        }
        return { trainingItemsCreated, mistakes };
      });
      return {
        submissionId: submission.id,
        analysisId: analysisRecord.id,
        status: 'completed',
        analysis: {
          detectedLanguage: sanitized.detectedLanguage,
          overallFeedback: sanitized.overallFeedback,
          styleFeedback: sanitized.styleFeedback,
          correctedText: sanitized.correctedText,
          mistakes: persisted.mistakes,
        },
        trainingItemsCreated: persisted.trainingItemsCreated,
      };
    } catch (error) {
      const safeMessage = error instanceof Error ? error.message : 'Language analysis failed.';
      await this.context.repositories.analyses.fail(analysisRecord.id, safeMessage);
      const code = error instanceof LlmError ? error.code : 'ANALYSIS_FAILED';
      const statusCode = code === 'LLM_TIMEOUT' ? 504 : 502;
      throw new AppError(code, 'The language analysis could not be completed.', statusCode, null, {
        submissionId: submission.id,
        analysisId: analysisRecord.id,
      });
    }
  }
}
