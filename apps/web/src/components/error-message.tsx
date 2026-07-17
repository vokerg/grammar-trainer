import { useI18n } from '../i18n.js';

export function ErrorMessage({ message }: { message: string }) {
  const { t } = useI18n();
  return (
    <div className="error-message" role="alert">
      <strong>{t('error.title')}</strong>
      <span>{message}</span>
    </div>
  );
}
