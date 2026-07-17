import { useEffect, useState } from 'react';

const draftKey = 'grammar-trainer:draft';

export function useLocalDraft(): [string, (value: string) => void, () => void] {
  const [draft, setDraftState] = useState(() => localStorage.getItem(draftKey) ?? '');
  const setDraft = (value: string): void => setDraftState(value);
  const clearDraft = (): void => {
    localStorage.removeItem(draftKey);
    setDraftState('');
  };
  useEffect(() => {
    if (draft.length === 0) localStorage.removeItem(draftKey);
    else localStorage.setItem(draftKey, draft);
  }, [draft]);
  return [draft, setDraft, clearDraft];
}
