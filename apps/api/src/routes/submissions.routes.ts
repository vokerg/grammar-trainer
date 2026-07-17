import { CreateSubmissionRequestSchema } from '@grammar/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AnalyzeSubmissionService } from '../services/analyze-submission.service.js';
import type { CreateSubmissionService } from '../services/create-submission.service.js';
import type {
  GetSubmissionService,
  ListSubmissionsService,
} from '../services/get-submission.service.js';

const IdParamsSchema = z.object({ submissionId: z.string().min(1) });
const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).optional(),
});

export function registerSubmissionRoutes(
  app: FastifyInstance,
  services: {
    create: CreateSubmissionService;
    analyze: AnalyzeSubmissionService;
    get: GetSubmissionService;
    list: ListSubmissionsService;
  },
): void {
  app.post('/api/submissions', async (request, reply) => {
    const body = CreateSubmissionRequestSchema.parse(request.body);
    const result = await services.create.execute(body);
    return reply.code(201).send(result);
  });

  app.get('/api/submissions', async (request) => {
    const query = ListQuerySchema.parse(request.query);
    return services.list.execute({
      limit: query.limit,
      ...(query.cursor === undefined ? {} : { cursor: query.cursor }),
    });
  });

  app.get('/api/submissions/:submissionId', async (request) => {
    const { submissionId } = IdParamsSchema.parse(request.params);
    return services.get.execute(submissionId);
  });

  app.post('/api/submissions/:submissionId/analyze', async (request) => {
    const { submissionId } = IdParamsSchema.parse(request.params);
    return services.analyze.execute({ submissionId });
  });
}
