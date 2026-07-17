import type { LlmConfig } from '@grammar/config';
import { LlmError } from '../errors/llm-errors.js';
import { tryValidateAnalysis } from '../parsing/validate-analysis.js';
import { createGrammarUserPrompt, grammarSystemPrompt } from '../prompts/grammar-system-prompt.js';
import { createRepairPrompt } from '../prompts/repair-system-prompt.js';
import type { AnalyzeTextInput, LanguageModelProvider, ProviderAnalysisResult } from '../types.js';

type CompletionResponse = { choices?: Array<{ message?: { content?: string } }> };

type Message = { role: 'system' | 'user'; content: string };

export class OpenAICompatibleLanguageModelProvider implements LanguageModelProvider {
  readonly providerName = 'openai-compatible';
  readonly modelName: string;

  constructor(private readonly config: LlmConfig) {
    this.modelName = config.model;
  }

  async analyzeText(input: AnalyzeTextInput): Promise<ProviderAnalysisResult> {
    const firstContent = await this.request([
      { role: 'system', content: grammarSystemPrompt },
      { role: 'user', content: createGrammarUserPrompt(input.text, input.requestedLanguage) },
    ]);
    const firstValidation = tryValidateAnalysis(firstContent);
    if (firstValidation.success) {
      return {
        analysis: firstValidation.analysis,
        ...(this.config.storeRawResponse ? { rawResponse: firstContent } : {}),
        repaired: false,
      };
    }

    if (this.config.maxRetries < 1) {
      throw new LlmError('LLM_INVALID_RESPONSE', 'The language model returned an invalid response.');
    }

    const repairedContent = await this.request([
      { role: 'system', content: grammarSystemPrompt },
      { role: 'user', content: createRepairPrompt(firstContent, firstValidation.errorSummary) },
    ]);
    const repairedValidation = tryValidateAnalysis(repairedContent);
    if (!repairedValidation.success) {
      throw new LlmError('LLM_INVALID_RESPONSE', 'The language model returned invalid JSON after repair.');
    }
    return {
      analysis: repairedValidation.analysis,
      ...(this.config.storeRawResponse ? { rawResponse: repairedContent } : {}),
      repaired: true,
    };
  }

  private async request(messages: Message[]): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (this.config.apiKey.trim().length > 0) headers.authorization = `Bearer ${this.config.apiKey}`;
      const response = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });
      if (!response.ok) {
        throw new LlmError('LLM_UNAVAILABLE', `Language model request failed with status ${response.status}.`);
      }
      const payload = (await response.json()) as CompletionResponse;
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim().length === 0) {
        throw new LlmError('LLM_INVALID_RESPONSE', 'The language model returned no message content.');
      }
      return content;
    } catch (error) {
      if (error instanceof LlmError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LlmError('LLM_TIMEOUT', 'The language model request timed out.', { cause: error });
      }
      throw new LlmError(
        'LLM_UNAVAILABLE',
        'The language model request failed.',
        error instanceof Error ? { cause: error } : undefined,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
