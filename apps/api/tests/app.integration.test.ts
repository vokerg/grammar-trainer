import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LanguageModelProvider, ProviderAnalysisResult } from '@grammar/llm';
import { LlmError, MockLanguageModelProvider } from '@grammar/llm';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

const databasePath = resolve(process.cwd(), '../../prisma/integration-test.db');
const databaseUrl = 'file:./integration-test.db';
let prisma: PrismaClient;

const env = loadEnv({
  NODE_ENV: 'test',
  API_PORT: '3001',
  WEB_ORIGIN: 'http://localhost:5173',
  DATABASE_URL: databaseUrl,
  LLM_PROVIDER: 'mock',
  LLM_BASE_URL: 'http://localhost:11434/v1',
  LLM_MODEL: 'qwen2.5',
  LLM_API_KEY: '',
  LLM_TIMEOUT_MS: '1000',
  LLM_MAX_RETRIES: '1',
  LLM_STORE_RAW_RESPONSE: 'false',
  MOCK_LLM_MODE: 'success',
  LOG_LEVEL: 'silent',
});

beforeAll(() => {
  rmSync(databasePath, { force: true });
  execFileSync('pnpm', ['exec', 'prisma', 'db', 'push', '--schema', '../../prisma/schema.prisma'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'ignore',
  });
  prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
});

beforeEach(async () => {
  await prisma.trainingAttempt.deleteMany();
  await prisma.mistake.deleteMany();
  await prisma.trainingItem.deleteMany();
  await prisma.analysis.deleteMany();
  await prisma.submission.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  rmSync(databasePath, { force: true });
});

async function createTestApp(provider: LanguageModelProvider = new MockLanguageModelProvider(env.llm)) {
  return buildApp({ env, prisma, llmProvider: provider });
}

describe('grammar trainer API', () => {
  it('creates a submission, persists analysis, and creates a training item', async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/submissions',
      payload: { text: 'Jeg synes nyheden var interesant.', language: 'da' },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.status).toBe('completed');
    expect(body.trainingItemsCreated).toBe(1);
    expect(await prisma.submission.count()).toBe(1);
    expect(await prisma.trainingItem.count()).toBe(1);
    await app.close();
  });

  it('preserves a submission when language analysis fails', async () => {
    const provider: LanguageModelProvider = {
      providerName: 'failing-test',
      modelName: 'test',
      analyzeText: async (): Promise<ProviderAnalysisResult> => {
        throw new LlmError('LLM_UNAVAILABLE', 'Unavailable');
      },
    };
    const app = await createTestApp(provider);
    const response = await app.inject({
      method: 'POST',
      url: '/api/submissions',
      payload: { text: 'Dette er en tekst.', language: 'da' },
    });
    expect(response.statusCode).toBe(502);
    expect(await prisma.submission.count()).toBe(1);
    expect(await prisma.analysis.findFirst()).toMatchObject({ status: 'FAILED' });
    await app.close();
  });

  it('merges duplicate training items', async () => {
    const app = await createTestApp();
    for (let count = 0; count < 2; count += 1) {
      await app.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: { text: 'Det var interesant.', language: 'da' },
      });
    }
    expect(await prisma.trainingItem.count()).toBe(1);
    expect(await prisma.mistake.count()).toBe(2);
    await app.close();
  });

  it('does not expose correct-answer metadata in a training session', async () => {
    const app = await createTestApp();
    await app.inject({
      method: 'POST',
      url: '/api/submissions',
      payload: { text: 'Det var interesant.', language: 'da' },
    });
    const response = await app.inject({ method: 'GET', url: '/api/training/session?language=da' });
    expect(response.statusCode).toBe(200);
    expect(response.body).not.toContain('correctForm');
    expect(response.body).not.toContain('normalizedCorrect');
    expect(response.json().items[0].options).toHaveLength(4);
    await app.close();
  });

  it('records correct and incorrect answers and rejects unknown options', async () => {
    const app = await createTestApp();
    await app.inject({
      method: 'POST',
      url: '/api/submissions',
      payload: { text: 'Det var interesant.', language: 'da' },
    });
    const item = await prisma.trainingItem.findFirstOrThrow();
    const correct = await app.inject({
      method: 'POST',
      url: `/api/training/items/${item.id}/answer`,
      payload: { selectedOption: 'interessant' },
    });
    expect(correct.json().wasCorrect).toBe(true);
    const incorrect = await app.inject({
      method: 'POST',
      url: `/api/training/items/${item.id}/answer`,
      payload: { selectedOption: 'interesant' },
    });
    expect(incorrect.json().wasCorrect).toBe(false);
    const invalid = await app.inject({
      method: 'POST',
      url: `/api/training/items/${item.id}/answer`,
      payload: { selectedOption: 'not-an-option' },
    });
    expect(invalid.statusCode).toBe(400);
    expect(await prisma.trainingAttempt.count()).toBe(2);
    await app.close();
  });

  it('can retry a previously failed submission', async () => {
    let shouldFail = true;
    const successProvider = new MockLanguageModelProvider(env.llm);
    const provider: LanguageModelProvider = {
      providerName: 'flaky-test',
      modelName: 'test',
      analyzeText: async (input) => {
        if (shouldFail) throw new LlmError('LLM_UNAVAILABLE', 'Unavailable');
        return successProvider.analyzeText(input);
      },
    };
    const app = await createTestApp(provider);
    const failed = await app.inject({
      method: 'POST',
      url: '/api/submissions',
      payload: { text: 'Det var interesant.', language: 'da' },
    });
    const submissionId = failed.json().error.submissionId;
    shouldFail = false;
    const retried = await app.inject({
      method: 'POST',
      url: `/api/submissions/${submissionId}/analyze`,
    });
    expect(retried.statusCode).toBe(200);
    expect(retried.json().status).toBe('completed');
    expect(await prisma.analysis.count()).toBe(2);
    await app.close();
  });
});
