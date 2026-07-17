import { LlmConfigSchema, type LlmConfig } from '@grammar/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  LLM_PROVIDER: z.enum(['mock', 'openai-compatible']).default('mock'),
  LLM_BASE_URL: z.string().url().default('http://localhost:11434/v1'),
  LLM_MODEL: z.string().min(1).default('qwen2.5'),
  LLM_API_KEY: z.string().default(''),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
  LLM_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
  LLM_STORE_RAW_RESPONSE: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  LLM_DEBUG_LOGGING: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  LLM_REASONING_EFFORT: z
    .enum(['none', 'low', 'medium', 'high'])
    .or(z.literal(''))
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  LLM_THINKING_MODE: z.enum(['default', 'disabled']).default('default'),
  MOCK_LLM_MODE: z
    .enum(['success', 'no-mistakes', 'invalid-json', 'timeout', 'provider-error'])
    .default('success'),
  LOG_LEVEL: z.string().default('info'),
});

export type AppEnv = z.infer<typeof EnvSchema> & { llm: LlmConfig };

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = EnvSchema.parse(source);
  return {
    ...parsed,
    llm: LlmConfigSchema.parse({
      provider: parsed.LLM_PROVIDER,
      baseUrl: parsed.LLM_BASE_URL,
      model: parsed.LLM_MODEL,
      apiKey: parsed.LLM_API_KEY,
      timeoutMs: parsed.LLM_TIMEOUT_MS,
      maxRetries: parsed.LLM_MAX_RETRIES,
      storeRawResponse: parsed.LLM_STORE_RAW_RESPONSE,
      debugLogging: parsed.LLM_DEBUG_LOGGING,
      reasoningEffort: parsed.LLM_REASONING_EFFORT,
      thinkingMode: parsed.LLM_THINKING_MODE,
      mockMode: parsed.MOCK_LLM_MODE,
    }),
  };
}
