import { z } from 'zod';

export const supportedLanguages = ['da', 'en', 'de', 'ru'] as const;
export const SupportedLanguageSchema = z.enum(supportedLanguages);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

export const mistakeCategories = [
  'spelling',
  'grammar',
  'word-choice',
  'expression',
  'capitalization',
  'punctuation',
  'other',
] as const;
export const MistakeCategorySchema = z.enum(mistakeCategories);
export type MistakeCategory = z.infer<typeof MistakeCategorySchema>;

export const trainingReasonCodes = [
  'added',
  'model-not-trainable',
  'capitalization-excluded',
  'missing-context',
  'invalid-options',
] as const;
export const TrainingReasonSchema = z.enum(trainingReasonCodes);
export type TrainingReason = z.infer<typeof TrainingReasonSchema>;

export const TrainingOptionsSchema = z.object({
  originalOption: z.string().min(1).max(500),
  correctOption: z.string().min(1).max(500),
  distractors: z.tuple([z.string().min(1).max(500), z.string().min(1).max(500)]),
});
export type TrainingOptions = z.infer<typeof TrainingOptionsSchema>;

export const GrammarMistakeSchema = z.object({
  original: z.string().min(1),
  correct: z.string().min(1),
  explanation: z.string().min(1),
  category: MistakeCategorySchema,
  originalSentence: z.string().min(1).optional(),
  trainable: z.boolean(),
  trainingOptions: TrainingOptionsSchema.optional(),
  // Accepted temporarily so older OpenAI-compatible models can still be repaired into context options.
  distractors: z.tuple([z.string().min(1), z.string().min(1)]).optional(),
});

export const GrammarAnalysisSchema = z.object({
  detectedLanguage: z.string().min(1),
  overallFeedback: z.string().min(1),
  styleFeedback: z.array(z.string().min(1)).max(8),
  correctedText: z.string().min(1),
  mistakes: z.array(GrammarMistakeSchema).max(50),
});
export type GrammarAnalysis = z.infer<typeof GrammarAnalysisSchema>;
export type GrammarMistake = z.infer<typeof GrammarMistakeSchema>;

export const CreateSubmissionRequestSchema = z.object({
  text: z
    .string()
    .max(10_000)
    .refine(
      (value) => value.trim().length >= 3,
      'Text must contain at least 3 visible characters.',
    ),
  language: SupportedLanguageSchema,
});
export type CreateSubmissionRequest = z.infer<typeof CreateSubmissionRequestSchema>;

export const ApiMistakeSchema = GrammarMistakeSchema.extend({
  id: z.string(),
  addedToTraining: z.boolean(),
  trainingReason: TrainingReasonSchema.optional(),
});

export const AnalysisPayloadSchema = z.object({
  detectedLanguage: z.string(),
  overallFeedback: z.string(),
  styleFeedback: z.array(z.string()),
  correctedText: z.string(),
  mistakes: z.array(ApiMistakeSchema),
});

export const SubmissionAnalysisResponseSchema = z.object({
  submissionId: z.string(),
  analysisId: z.string(),
  status: z.enum(['completed', 'failed', 'pending']),
  analysis: AnalysisPayloadSchema.optional(),
  trainingItemsCreated: z.number().int().nonnegative(),
});
export type SubmissionAnalysisResponse = z.infer<typeof SubmissionAnalysisResponseSchema>;

export const SubmissionDetailSchema = z.object({
  id: z.string(),
  text: z.string(),
  language: SupportedLanguageSchema,
  createdAt: z.string(),
  latestAnalysis: SubmissionAnalysisResponseSchema.nullable(),
});
export type SubmissionDetail = z.infer<typeof SubmissionDetailSchema>;

export const SubmissionHistorySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      textPreview: z.string(),
      language: SupportedLanguageSchema,
      createdAt: z.string(),
      status: z.enum(['completed', 'failed', 'pending']).nullable(),
    }),
  ),
  nextCursor: z.string().nullable(),
});
export type SubmissionHistory = z.infer<typeof SubmissionHistorySchema>;

export const TrainingSessionItemSchema = z.object({
  id: z.string(),
  category: MistakeCategorySchema,
  prompt: z.string(),
  exerciseType: z.enum(['form', 'context']).default('form'),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
});
export const TrainingSessionResponseSchema = z.object({
  sessionId: z.string(),
  items: z.array(TrainingSessionItemSchema),
});
export type TrainingSessionResponse = z.infer<typeof TrainingSessionResponseSchema>;
export type TrainingSessionItem = z.infer<typeof TrainingSessionItemSchema>;

export const TrainingAnswerRequestSchema = z.object({ selectedOption: z.string().min(1).max(500) });
export const TrainingAnswerResponseSchema = z.object({
  wasCorrect: z.boolean(),
  correctAnswer: z.string(),
  selectedOption: z.string(),
  stats: z.object({
    timesSeen: z.number().int().nonnegative(),
    timesCorrect: z.number().int().nonnegative(),
    timesIncorrect: z.number().int().nonnegative(),
  }),
});
export type TrainingAnswerResponse = z.infer<typeof TrainingAnswerResponseSchema>;

export const TrainingStatsResponseSchema = z.object({
  activeItems: z.number().int().nonnegative(),
  totalAttempts: z.number().int().nonnegative(),
  correctAttempts: z.number().int().nonnegative(),
  incorrectAttempts: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(1),
  recentlyPractised: z.number().int().nonnegative(),
});
export type TrainingStatsResponse = z.infer<typeof TrainingStatsResponseSchema>;

export const VocabularyItemSchema = z.object({
  id: z.string(),
  category: MistakeCategorySchema,
  original: z.string(),
  correct: z.string(),
  timesSeen: z.number().int().nonnegative(),
  timesCorrect: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export const VocabularyResponseSchema = z.object({
  items: z.array(VocabularyItemSchema),
});
export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type VocabularyResponse = z.infer<typeof VocabularyResponseSchema>;

export const PublicConfigResponseSchema = z.object({
  llmProvider: z.string(),
  llmModel: z.string(),
  localMode: z.boolean(),
  supportedLanguages: z.array(SupportedLanguageSchema),
});
export type PublicConfigResponse = z.infer<typeof PublicConfigResponseSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().nullable(),
    submissionId: z.string().optional(),
    analysisId: z.string().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>;

const languageLocales: Record<SupportedLanguage, string> = {
  da: 'da-DK',
  en: 'en-US',
  de: 'de-DE',
  ru: 'ru-RU',
};

export function languageToLocale(language: string): string {
  return SupportedLanguageSchema.safeParse(language).success
    ? languageLocales[language as SupportedLanguage]
    : language;
}

export function normalizeTrainingText(value: string, language: string): string {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase(languageToLocale(language));
}
