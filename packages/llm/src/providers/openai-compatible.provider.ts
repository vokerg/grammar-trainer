import type { LlmConfig } from '@grammar/config';
import { LlmError } from '../errors/llm-errors.js';
import { tryValidateAnalysis } from '../parsing/validate-analysis.js';
import { createGrammarUserPrompt, grammarSystemPrompt } from '../prompts/grammar-system-prompt.js';
import { createRepairPrompt } from '../prompts/repair-system-prompt.js';
import type { AnalyzeTextInput, LanguageModelProvider, ProviderAnalysisResult } from '../types.js';

type CompletionResponse = { choices?: Array<{ message?: { content?: string } }> };

type Message = { role: 'system' | 'user'; content: string };

type RequestPurpose = 'analysis' | 'repair';

export class OpenAICompatibleLanguageModelProvider implements LanguageModelProvider {
  readonly providerName = 'openai-compatible';
  readonly modelName: string;
  private requestCount = 0;

  constructor(private readonly config: LlmConfig) {
    this.modelName = config.model;
  }

  async analyzeText(input: AnalyzeTextInput): Promise<ProviderAnalysisResult> {
    const firstContent = await this.request(
      [
        { role: 'system', content: grammarSystemPrompt },
        { role: 'user', content: createGrammarUserPrompt(input.text, input.requestedLanguage) },
      ],
      'analysis',
    );
    const firstValidation = tryValidateAnalysis(firstContent);
    if (firstValidation.success) {
      return {
        analysis: firstValidation.analysis,
        ...(this.config.storeRawResponse ? { rawResponse: firstContent } : {}),
        repaired: false,
      };
    }

    if (this.config.maxRetries < 1) {
      throw new LlmError(
        'LLM_INVALID_RESPONSE',
        'The language model returned an invalid response.',
      );
    }

    const repairedContent = await this.request(
      [
        { role: 'system', content: grammarSystemPrompt },
        { role: 'user', content: createRepairPrompt(firstContent, firstValidation.errorSummary) },
      ],
      'repair',
    );
    const repairedValidation = tryValidateAnalysis(repairedContent);
    if (!repairedValidation.success) {
      throw new LlmError(
        'LLM_INVALID_RESPONSE',
        'The language model returned invalid JSON after repair.',
      );
    }
    return {
      analysis: repairedValidation.analysis,
      ...(this.config.storeRawResponse ? { rawResponse: repairedContent } : {}),
      repaired: true,
    };
  }

  private async request(messages: Message[], purpose: RequestPurpose): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const requestId = ++this.requestCount;
    const startedAt = Date.now();
    const endpoint = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const body = {
      model: this.config.model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      ...(this.config.reasoningEffort === undefined
        ? {}
        : { reasoning_effort: this.config.reasoningEffort }),
      ...(this.config.thinkingMode === 'default' ? {} : { thinking: { type: 'disabled' } }),
    };
    this.log('request.started', {
      requestId,
      purpose,
      endpoint,
      model: this.config.model,
      timeoutMs: this.config.timeoutMs,
      body,
    });
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (this.config.apiKey.trim().length > 0)
        headers.authorization = `Bearer ${this.config.apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const responseBody = await response.text();
        this.log('response.failed', {
          requestId,
          purpose,
          status: response.status,
          elapsedMs: Date.now() - startedAt,
          responseBody,
        });
        throw new LlmError(
          'LLM_UNAVAILABLE',
          `Language model request failed with status ${response.status}.`,
        );
      }
      const payload: unknown = await response.json();
      const completion = payload as CompletionResponse;
      const content = completion.choices?.[0]?.message?.content;
      this.log('response.received', {
        requestId,
        purpose,
        status: response.status,
        elapsedMs: Date.now() - startedAt,
        content,
        response: payload,
      });
      if (typeof content !== 'string' || content.trim().length === 0) {
        throw new LlmError(
          'LLM_INVALID_RESPONSE',
          'The language model returned no message content.',
        );
      }
      return content;
    } catch (error) {
      if (error instanceof LlmError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        this.log('request.timed_out', {
          requestId,
          purpose,
          elapsedMs: Date.now() - startedAt,
          timeoutMs: this.config.timeoutMs,
        });
        throw new LlmError('LLM_TIMEOUT', 'The language model request timed out.', {
          cause: error,
        });
      }
      this.log('request.failed', {
        requestId,
        purpose,
        elapsedMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new LlmError(
        'LLM_UNAVAILABLE',
        'The language model request failed.',
        error instanceof Error ? { cause: error } : undefined,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private log(event: string, details: Record<string, unknown>): void {
    if (!this.config.debugLogging) return;
    console.info(JSON.stringify({ component: 'llm', event, ...details }));
  }
}
