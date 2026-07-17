import { useEffect } from 'react';

export function useKeyboardOptions(
  enabled: boolean,
  onSelect: (index: number) => void,
): void {
  useEffect(() => {
    if (!enabled) return undefined;
    const listener = (event: KeyboardEvent): void => {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index <= 3) onSelect(index);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled, onSelect]);
}
