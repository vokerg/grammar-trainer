import type { Analysis, Mistake, Submission, TrainingItem, VocabularyEntry } from '@prisma/client';
import type { SanitizedMistake } from '../domain/training-validation.js';

export interface SubmissionRepository {
  create(input: { text: string; language: string }): Promise<Submission>;
  findById(id: string): Promise<Submission | null>;
  findDetail(
    id: string,
  ): Promise<(Submission & { analyses: Array<Analysis & { mistakes: Mistake[] }> }) | null>;
  list(input: {
    limit: number;
    cursor?: string;
  }): Promise<Array<Submission & { analyses: Analysis[] }>>;
}

export interface AnalysisRepository {
  createPending(submissionId: string): Promise<Analysis>;
  complete(input: {
    id: string;
    detectedLanguage: string;
    overallFeedback: string;
    correctedText: string;
    styleFeedback: string[];
    provider: string;
    model: string;
    rawResponse?: string;
  }): Promise<Analysis>;
  fail(id: string, errorMessage: string): Promise<Analysis>;
}

export interface MistakeRepository {
  create(input: {
    analysisId: string;
    language: string;
    mistake: SanitizedMistake;
  }): Promise<Mistake>;
  attachTrainingItem(mistakeId: string, trainingItemId: string): Promise<void>;
}

export interface TrainingItemRepository {
  findSessionItems(input: { language?: string; submissionId?: string }): Promise<TrainingItem[]>;
  findById(id: string): Promise<TrainingItem | null>;
  createOrMergeFromMistake(input: {
    language: string;
    mistake: SanitizedMistake;
    vocabularyEntryId: string;
  }): Promise<{ item: TrainingItem; created: boolean }>;
  recordAttempt(input: {
    trainingItemId: string;
    selectedOption: string;
    wasCorrect: boolean;
    practicedAt: Date;
  }): Promise<TrainingItem>;
  getStats(language?: string): Promise<{
    activeItems: number;
    totalAttempts: number;
    correctAttempts: number;
    incorrectAttempts: number;
    recentlyPractised: number;
  }>;
}

export interface VocabularyRepository {
  createOrFindFromMistake(input: {
    language: string;
    mistake: SanitizedMistake;
  }): Promise<VocabularyEntry>;
  list(input: { language?: string }): Promise<VocabularyEntry[]>;
  deactivate(id: string): Promise<void>;
  findById(id: string): Promise<VocabularyEntry | null>;
}

export type RepositoryBundle = {
  submissions: SubmissionRepository;
  analyses: AnalysisRepository;
  mistakes: MistakeRepository;
  trainingItems: TrainingItemRepository;
  vocabulary: VocabularyRepository;
};

export interface RepositoryContext {
  readonly repositories: RepositoryBundle;
  transaction<T>(work: (repositories: RepositoryBundle) => Promise<T>): Promise<T>;
}
