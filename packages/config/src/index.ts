import { z } from 'zod';

export const LlmConfigSchema = z.object({
  provider: z.enum(['mock', 'openai-compatible']),
  baseUrl: z.string().url(),
  model: z.string().min(1),
  apiKey: z.string(),
  timeoutMs: z.number().int().positive(),
  maxRetries: z.number().int().min(0).max(3),
  storeRawResponse: z.boolean(),
  mockMode: z.enum(['success', 'no-mistakes', 'invalid-json', 'timeout', 'provider-error']),
});
export type LlmConfig = z.infer<typeof LlmConfigSchema>;

export function isLocalEndpoint(baseUrl: string): boolean {
  const hostname = new URL(baseUrl).hostname;
  return ['localhost', '127.0.0.1', '::1', 'host.docker.internal'].includes(hostname);
}
