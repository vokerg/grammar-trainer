import { SupportedLanguageSchema, TrainingAnswerRequestSchema } from '@grammar/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type {
  AnswerTrainingItemService,
  GetTrainingSessionService,
  GetTrainingStatsService,
} from '../services/training.service.js';

const SessionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  language: SupportedLanguageSchema.optional(),
});
const AnswerParamsSchema = z.object({ trainingItemId: z.string().min(1) });
const StatsQuerySchema = z.object({ language: SupportedLanguageSchema.optional() });

export function registerTrainingRoutes(
  app: FastifyInstance,
  services: {
    session: GetTrainingSessionService;
    answer: AnswerTrainingItemService;
    stats: GetTrainingStatsService;
  },
): void {
  app.get('/api/training/session', async (request) => {
    const query = SessionQuerySchema.parse(request.query);
    return services.session.execute(query);
  });

  app.post('/api/training/items/:trainingItemId/answer', async (request) => {
    const { trainingItemId } = AnswerParamsSchema.parse(request.params);
    const body = TrainingAnswerRequestSchema.parse(request.body);
    return services.answer.execute({ trainingItemId, selectedOption: body.selectedOption });
  });

  app.get('/api/training/stats', async (request) => {
    const query = StatsQuerySchema.parse(request.query);
    return services.stats.execute(query.language);
  });
}
