import { describe, expect, it } from 'vitest';
import { extractJsonText } from './extract-json.js';
import { tryValidateAnalysis } from './validate-analysis.js';

describe('LLM response parsing', () => {
  it('removes markdown fences', () => {
    expect(extractJsonText('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
  });

  it('rejects a malformed canonical response', () => {
    const result = tryValidateAnalysis('{"detectedLanguage":"da"}');
    expect(result.success).toBe(false);
  });

  it('accepts a valid response', () => {
    const result = tryValidateAnalysis(
      JSON.stringify({
        detectedLanguage: 'da',
        overallFeedback: 'Godt arbejde.',
        styleFeedback: [],
        correctedText: 'Hej.',
        mistakes: [],
      }),
    );
    expect(result.success).toBe(true);
  });
});
