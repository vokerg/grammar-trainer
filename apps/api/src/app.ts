import cors from '@fastify/cors';
import { createLanguageModelProvider, type LanguageModelProvider } from '@grammar/llm';
import { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { loadEnv, type AppEnv } from './config/env.js';
import { AppError } from './domain/errors.js';
import { PrismaRepositoryContext } from './repositories/prisma-repositories.js';
import { registerConfigRoutes } from './routes/config.routes.js';
import { registerHealthRoutes } from './routes/health.routes.js';
import { registerSubmissionRoutes } from './routes/submissions.routes.js';
import { registerTrainingRoutes } from './routes/training.routes.js';
import { AnalyzeSubmissionService } from './services/analyze-submission.service.js';
import { CreateSubmissionService } from './services/create-submission.service.js';
import { GetSubmissionService, ListSubmissionsService } from './services/get-submission.service.js';
import {
  AnswerTrainingItemService,
  GetTrainingSessionService,
  GetTrainingStatsService,
  GetVocabularyService,
  DeleteVocabularyItemService,
} from './services/training.service.js';

export type BuildAppOptions = {
  env?: AppEnv;
  prisma?: PrismaClient;
  llmProvider?: LanguageModelProvider;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();
  const prisma =
    options.prisma ?? new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  const provider = options.llmProvider ?? createLanguageModelProvider(env.llm);
  const context = new PrismaRepositoryContext(prisma);
  const analyze = new AnalyzeSubmissionService(context, provider);
  const services = {
    create: new CreateSubmissionService(context, analyze),
    analyze,
    get: new GetSubmissionService(context),
    list: new ListSubmissionsService(context),
    session: new GetTrainingSessionService(context),
    answer: new AnswerTrainingItemService(context),
    stats: new GetTrainingStatsService(context),
    vocabulary: new GetVocabularyService(context),
    deleteVocabularyItem: new DeleteVocabularyItemService(context),
  };
  const app = Fastify({
    logger: env.NODE_ENV !== 'test' ? { level: env.LOG_LEVEL } : false,
    disableRequestLogging: false,
  });

  await app.register(cors, { origin: env.WEB_ORIGIN });
  registerHealthRoutes(app, prisma, provider);
  registerConfigRoutes(app, env);
  registerSubmissionRoutes(app, services);
  registerTrainingRoutes(app, services);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request was invalid.',
          details: error.flatten(),
        },
      });
    }
    if (error instanceof AppError) {
      request.log.warn({ code: error.code }, error.message);
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          ...(error.context?.submissionId === undefined
            ? {}
            : { submissionId: error.context.submissionId }),
          ...(error.context?.analysisId === undefined
            ? {}
            : { analysisId: error.context.analysisId }),
        },
      });
    }
    request.log.error(error);
    return reply.code(500).send({
      error: { code: 'DATABASE_ERROR', message: 'An unexpected error occurred.', details: null },
    });
  });

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
}
