import type { MistakeCategory as PrismaMistakeCategory } from '@prisma/client';
import type { MistakeCategory } from '@grammar/shared';

const toPrismaMap: Record<MistakeCategory, PrismaMistakeCategory> = {
  spelling: 'SPELLING',
  grammar: 'GRAMMAR',
  'word-choice': 'WORD_CHOICE',
  expression: 'EXPRESSION',
  capitalization: 'CAPITALIZATION',
  punctuation: 'PUNCTUATION',
  other: 'OTHER',
};

const fromPrismaMap: Record<PrismaMistakeCategory, MistakeCategory> = {
  SPELLING: 'spelling',
  GRAMMAR: 'grammar',
  WORD_CHOICE: 'word-choice',
  EXPRESSION: 'expression',
  CAPITALIZATION: 'capitalization',
  PUNCTUATION: 'punctuation',
  OTHER: 'other',
};

export const toPrismaCategory = (category: MistakeCategory): PrismaMistakeCategory =>
  toPrismaMap[category];
export const fromPrismaCategory = (category: PrismaMistakeCategory): MistakeCategory =>
  fromPrismaMap[category];
