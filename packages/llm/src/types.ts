import type { GrammarAnalysis } from '@grammar/shared';

export type AnalyzeTextInput = {
  text: string;
  requestedLanguage: string;
};

export type ProviderAnalysisResult = {
  analysis: GrammarAnalysis;
  rawResponse?: string;
  repaired: boolean;
};

export interface LanguageModelProvider {
  readonly providerName: string;
  readonly modelName: string;
  analyzeText(input: AnalyzeTextInput): Promise<ProviderAnalysisResult>;
}
