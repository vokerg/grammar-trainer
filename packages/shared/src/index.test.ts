import { describe, expect, it } from 'vitest';
import { normalizeTrainingText } from './index.js';

describe('normalizeTrainingText', () => {
  it('preserves Nordic letters while normalizing case and whitespace', () => {
    expect(normalizeTrainingText('  BLÅ   BÆR  ', 'da')).toBe('blå bær');
  });

  it('normalizes canonically equivalent Unicode', () => {
    expect(normalizeTrainingText('A\u030A', 'da')).toBe(normalizeTrainingText('Å', 'da'));
  });
});
