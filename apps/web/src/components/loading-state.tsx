import { useI18n } from '../i18n.js';

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label ?? t('loading.default')}
    </div>
  );
}
