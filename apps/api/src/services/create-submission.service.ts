import type { CreateSubmissionRequest, SubmissionAnalysisResponse } from '@grammar/shared';
import type { RepositoryContext } from '../repositories/contracts.js';
import type { AnalyzeSubmissionService } from './analyze-submission.service.js';

export class CreateSubmissionService {
  constructor(
    private readonly context: RepositoryContext,
    private readonly analyzeSubmission: AnalyzeSubmissionService,
  ) {}

  async execute(input: CreateSubmissionRequest): Promise<SubmissionAnalysisResponse> {
    const submission = await this.context.repositories.submissions.create(input);
    const analysis = await this.context.repositories.analyses.createPending(submission.id);
    return this.analyzeSubmission.execute({ submissionId: submission.id, analysisId: analysis.id });
  }
}
