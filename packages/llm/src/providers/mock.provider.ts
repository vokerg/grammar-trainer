import type { LlmConfig } from '@grammar/config';
import type { GrammarAnalysis, SupportedLanguage } from '@grammar/shared';
import { LlmError } from '../errors/llm-errors.js';
import type { AnalyzeTextInput, LanguageModelProvider, ProviderAnalysisResult } from '../types.js';

const cleanFeedback: Record<SupportedLanguage, string> = {
  da: 'Du skriver tydeligt, og din tekst er let at følge.',
  en: 'Your writing is clear and easy to follow.',
  de: 'Dein Text ist klar und leicht zu verstehen.',
  ru: 'Ты пишешь понятно, и за твоим текстом легко следить.',
};

const styleTip: Record<SupportedLanguage, string> = {
  da: 'Prøv at variere begyndelsen på dine sætninger.',
  en: 'Try varying how your sentences begin.',
  de: 'Versuche, deine Sätze unterschiedlich zu beginnen.',
  ru: 'Попробуй по-разному начинать предложения.',
};

const explanation: Record<SupportedLanguage, string> = {
  da: 'Ordet staves med dobbelt s.',
  en: 'The word is spelled with a double s.',
  de: 'Das Wort wird mit einem zusätzlichen s geschrieben.',
  ru: 'В этом слове нужна двойная согласная.',
};

function replaceKnown(value: string, replacement: string): string {
  return value.replace(/interesant/gi, replacement);
}

function analysisFor(input: AnalyzeTextInput, noMistakes: boolean): GrammarAnalysis {
  const language = input.requestedLanguage as SupportedLanguage;
  const hasKnownMistake = !noMistakes && /interesant/i.test(input.text);
  const correctedText = hasKnownMistake ? replaceKnown(input.text, 'interessant') : input.text;
  return {
    detectedLanguage: input.requestedLanguage,
    overallFeedback: cleanFeedback[language] ?? cleanFeedback.en,
    styleFeedback: hasKnownMistake ? [styleTip[language] ?? styleTip.en] : [],
    correctedText,
    mistakes: hasKnownMistake
      ? [
          {
            original: 'interesant',
            correct: 'interessant',
            explanation: explanation[language] ?? explanation.en,
            category: 'spelling',
            originalSentence: input.text,
            trainable: true,
            trainingOptions: {
              originalOption: input.text,
              correctOption: correctedText,
              distractors: [
                replaceKnown(input.text, 'interressant'),
                replaceKnown(input.text, 'intressant'),
              ],
            },
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
        throw new LlmError(
          'LLM_INVALID_RESPONSE',
          'The mock language model returned invalid JSON.',
        );
      case 'no-mistakes':
        return { analysis: analysisFor(input, true), repaired: false };
      case 'success':
        return { analysis: analysisFor(input, false), repaired: false };
    }
  }
}
