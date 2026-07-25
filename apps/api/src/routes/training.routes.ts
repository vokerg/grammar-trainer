import { SupportedLanguageSchema, TrainingAnswerRequestSchema } from '@grammar/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type {
  AnswerTrainingItemService,
  GetTrainingSessionService,
  GetTrainingStatsService,
  GetVocabularyService,
  DeleteVocabularyItemService,
} from '../services/training.service.js';

const SessionQuerySchema = z.object({
  language: SupportedLanguageSchema.optional(),
  submissionId: z.string().min(1).optional(),
});
const AnswerParamsSchema = z.object({ trainingItemId: z.string().min(1) });
const StatsQuerySchema = z.object({ language: SupportedLanguageSchema.optional() });

export function registerTrainingRoutes(
  app: FastifyInstance,
  services: {
    session: GetTrainingSessionService;
    answer: AnswerTrainingItemService;
    stats: GetTrainingStatsService;
    vocabulary: GetVocabularyService;
    deleteVocabularyItem: DeleteVocabularyItemService;
  },
): void {
  app.get('/api/training/session', async (request) => {
    const query = SessionQuerySchema.parse(request.query);
    return services.session.execute({
      ...(query.language === undefined ? {} : { language: query.language }),
      ...(query.submissionId === undefined ? {} : { submissionId: query.submissionId }),
    });
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

  app.get('/api/vocabulary', async (request) => {
    const query = StatsQuerySchema.parse(request.query);
    return services.vocabulary.execute(query.language);
  });

  app.delete('/api/vocabulary/:trainingItemId', async (request, reply) => {
    const { trainingItemId } = AnswerParamsSchema.parse(request.params);
    await services.deleteVocabularyItem.execute(trainingItemId);
    return reply.code(204).send();
  });
}
