import { LlmError } from '../errors/llm-errors.js';

export function extractJsonText(content: string): string {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace < firstBrace) {
    throw new LlmError('LLM_INVALID_RESPONSE', 'The language model did not return a JSON object.');
  }
  return withoutFence.slice(firstBrace, lastBrace + 1);
}
