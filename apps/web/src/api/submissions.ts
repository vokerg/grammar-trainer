import {
  CreateSubmissionRequestSchema,
  SubmissionAnalysisResponseSchema,
  SubmissionDetailSchema,
  SubmissionHistorySchema,
  type CreateSubmissionRequest,
} from '@grammar/shared';
import { apiRequest } from './client.js';

export function createSubmission(input: CreateSubmissionRequest) {
  const body = CreateSubmissionRequestSchema.parse(input);
  return apiRequest('/api/submissions', SubmissionAnalysisResponseSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getSubmission(id: string) {
  return apiRequest(`/api/submissions/${encodeURIComponent(id)}`, SubmissionDetailSchema);
}

export function retrySubmission(id: string) {
  return apiRequest(
    `/api/submissions/${encodeURIComponent(id)}/analyze`,
    SubmissionAnalysisResponseSchema,
    { method: 'POST' },
  );
}

export function getSubmissionHistory() {
  return apiRequest('/api/submissions?limit=20', SubmissionHistorySchema);
}
