import {
  TrainingAnswerResponseSchema,
  TrainingSessionResponseSchema,
  TrainingStatsResponseSchema,
} from '@grammar/shared';
import { apiRequest } from './client.js';

export function getTrainingSession(language = 'da') {
  return apiRequest(
    `/api/training/session?limit=10&language=${encodeURIComponent(language)}`,
    TrainingSessionResponseSchema,
  );
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
