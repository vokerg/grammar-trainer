import type { LlmConfig } from '@grammar/config';
import type { GrammarAnalysis } from '@grammar/shared';
import { LlmError } from '../errors/llm-errors.js';
import type { AnalyzeTextInput, LanguageModelProvider, ProviderAnalysisResult } from '../types.js';

const cleanFeedback: Record<string, string> = {
  da: 'Du skriver tydeligt, og din tekst er let at følge.',
  en: 'Your writing is clear and easy to follow.',
  de: 'Dein Text ist klar und leicht zu verstehen.',
  sv: 'Din text är tydlig och lätt att följa.',
  no: 'Teksten din er tydelig og lett å følge.',
};

function analysisFor(input: AnalyzeTextInput, noMistakes: boolean): GrammarAnalysis {
  const hasKnownMistake = !noMistakes && /interesant/i.test(input.text);
  return {
    detectedLanguage: input.requestedLanguage,
    overallFeedback: cleanFeedback[input.requestedLanguage] ?? cleanFeedback.en ?? 'Good work.',
    styleFeedback: hasKnownMistake
      ? [input.requestedLanguage === 'da' ? 'Prøv at variere begyndelsen på dine sætninger.' : 'Try varying how your sentences begin.']
      : [],
    correctedText: hasKnownMistake ? input.text.replace(/interesant/gi, 'interessant') : input.text,
    mistakes: hasKnownMistake
      ? [
          {
            original: 'interesant',
            correct: 'interessant',
            explanation: input.requestedLanguage === 'da' ? 'Ordet staves med dobbelt s.' : 'The word is spelled with a double s.',
            category: 'spelling',
            originalSentence: input.text,
            trainable: true,
            distractors: ['interressant', 'intressant'],
          },
        ]
      : [],
  };
}

export class MockLanguageModelProvider implements LanguageModelProvider {
  readonly providerName = 'mock';
  readonly modelName: string;

  constructor(private readonly config: Pick<LlmConfig, 'model' | 'mockMode'>) {
    this.modelName = config.model;
  }

  async analyzeText(input: AnalyzeTextInput): Promise<ProviderAnalysisResult> {
    switch (this.config.mockMode) {
      case 'timeout':
        throw new LlmError('LLM_TIMEOUT', 'The mock language model timed out.');
      case 'provider-error':
        throw new LlmError('LLM_UNAVAILABLE', 'The mock language model is unavailable.');
      case 'invalid-json':
        throw new LlmError('LLM_INVALID_RESPONSE', 'The mock language model returned invalid JSON.');
      case 'no-mistakes':
        return { analysis: analysisFor(input, true), repaired: false };
      case 'success':
        return { analysis: analysisFor(input, false), repaired: false };
    }
  }
}
