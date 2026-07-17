export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'SUBMISSION_NOT_FOUND'
  | 'ANALYSIS_FAILED'
  | 'LLM_TIMEOUT'
  | 'LLM_INVALID_RESPONSE'
  | 'LLM_UNAVAILABLE'
  | 'LLM_PROVIDER_ERROR'
  | 'TRAINING_ITEM_NOT_FOUND'
  | 'INVALID_TRAINING_OPTION'
  | 'DATABASE_ERROR';

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly details: unknown = null,
    public readonly context?: { submissionId?: string; analysisId?: string },
  ) {
    super(message);
    this.name = 'AppError';
  }
}
