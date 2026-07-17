import { describe, expect, it } from 'vitest';
import { createLanguageModelProvider } from './provider-factory.js';

const baseConfig = {
  provider: 'mock' as const,
  baseUrl: 'http://localhost:11434/v1',
  model: 'qwen2.5',
  apiKey: '',
  timeoutMs: 1000,
  maxRetries: 1,
  storeRawResponse: false,
  debugLogging: false,
  reasoningEffort: 'none' as const,
  thinkingMode: 'default' as const,
  mockMode: 'success' as const,
};

describe('provider factory', () => {
  it('creates the mock provider', () => {
    expect(createLanguageModelProvider(baseConfig).providerName).toBe('mock');
  });

  it('creates the OpenAI-compatible provider', () => {
    expect(
      createLanguageModelProvider({ ...baseConfig, provider: 'openai-compatible' }).providerName,
    ).toBe('openai-compatible');
  });
});
