import { GrammarAnalysisSchema, type GrammarAnalysis } from '@grammar/shared';
import { LlmError } from '../errors/llm-errors.js';
import { extractJsonText } from './extract-json.js';

export type ValidationResult =
  | { success: true; analysis: GrammarAnalysis; jsonText: string }
  | { success: false; errorSummary: string; jsonText?: string };

export function tryValidateAnalysis(content: string): ValidationResult {
  let jsonText: string | undefined;
  try {
    jsonText = extractJsonText(content);
    const parsed: unknown = JSON.parse(jsonText);
    const result = GrammarAnalysisSchema.safeParse(parsed);
    if (!result.success) {
      return {
        success: false,
        jsonText,
        errorSummary: result.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; '),
      };
    }
    return { success: true, analysis: result.data, jsonText };
  } catch (error) {
    if (error instanceof LlmError) return { success: false, errorSummary: error.message };
    return {
      success: false,
      ...(jsonText === undefined ? {} : { jsonText }),
      errorSummary: error instanceof Error ? error.message : 'Unknown JSON parsing error',
    };
  }
}
