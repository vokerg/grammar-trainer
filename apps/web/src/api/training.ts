import {
  TrainingAnswerResponseSchema,
  TrainingSessionResponseSchema,
  TrainingStatsResponseSchema,
  VocabularyResponseSchema,
} from '@grammar/shared';
import { z } from 'zod';
import { apiRequest } from './client.js';

export function getTrainingSession(language = 'da', submissionId?: string) {
  const query = new URLSearchParams({ language });
  if (submissionId !== undefined) query.set('submissionId', submissionId);
  return apiRequest(`/api/training/session?${query.toString()}`, TrainingSessionResponseSchema);
}

export function answerTrainingItem(trainingItemId: string, selectedOption: string) {
  return apiRequest(
    `/api/training/items/${encodeURIComponent(trainingItemId)}/answer`,
    TrainingAnswerResponseSchema,
    { method: 'POST', body: JSON.stringify({ selectedOption }) },
  );
}

export function getTrainingStats(language = 'da') {
  return apiRequest(
    `/api/training/stats?language=${encodeURIComponent(language)}`,
    TrainingStatsResponseSchema,
  );
}

export function getVocabulary(language = 'da') {
  return apiRequest(
    `/api/vocabulary?language=${encodeURIComponent(language)}`,
    VocabularyResponseSchema,
  );
}

export function deleteVocabularyItem(trainingItemId: string) {
  return apiRequest(`/api/vocabulary/${encodeURIComponent(trainingItemId)}`, z.void(), {
    method: 'DELETE',
  });
}
