import { isLocalEndpoint } from '@grammar/config';
import { supportedLanguages } from '@grammar/shared';
import type { FastifyInstance } from 'fastify';
import type { AppEnv } from '../config/env.js';

export function registerConfigRoutes(app: FastifyInstance, env: AppEnv): void {
  app.get('/api/config', async () => ({
    llmProvider: env.llm.provider,
    llmModel: env.llm.model,
    localMode: env.llm.provider === 'mock' || isLocalEndpoint(env.llm.baseUrl),
    supportedLanguages,
  }));
}
