import type { LlmConfig } from '@grammar/config';
import type { LanguageModelProvider } from './types.js';
import { MockLanguageModelProvider } from './providers/mock.provider.js';
import { OpenAICompatibleLanguageModelProvider } from './providers/openai-compatible.provider.js';

export function createLanguageModelProvider(config: LlmConfig): LanguageModelProvider {
  switch (config.provider) {
    case 'mock':
      return new MockLanguageModelProvider(config);
    case 'openai-compatible':
      return new OpenAICompatibleLanguageModelProvider(config);
  }
}
