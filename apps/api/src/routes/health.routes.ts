import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { LanguageModelProvider } from '@grammar/llm';

export function registerHealthRoutes(
  app: FastifyInstance,
  prisma: PrismaClient,
  provider: LanguageModelProvider,
): void {
  app.get('/api/health', async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'ok', llmProvider: provider.providerName };
  });
}
