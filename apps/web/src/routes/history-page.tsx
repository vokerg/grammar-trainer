import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSubmissionHistory } from '../api/submissions.js';
import { ErrorMessage } from '../components/error-message.js';
import { LoadingState } from '../components/loading-state.js';
import { useI18n } from '../i18n.js';

export function HistoryPage() {
  const { locale, t } = useI18n();
  const query = useQuery({ queryKey: ['submission-history'], queryFn: getSubmissionHistory });
  if (query.isPending) return <LoadingState label={t('history.loading')} />;
  if (query.isError || query.data === undefined)
    return (
      <section className="page">
        <ErrorMessage message={t('history.loadError')} />
      </section>
    );
  return (
    <section className="page narrow-page">
      <p className="eyebrow">{t('history.eyebrow')}</p>
      <h1>{t('history.title')}</h1>
      {query.data.items.length === 0 ? (
        <p className="empty-state">{t('history.empty')}</p>
      ) : (
        <div className="history-list">
          {query.data.items.map((item) => (
            <Link to={`/result/${item.id}`} key={item.id} className="history-item">
              <span>{item.textPreview}</span>
              <small>
                {new Date(item.createdAt).toLocaleDateString(locale)} · {item.language} ·{' '}
                {item.status === null ? t('history.unknown') : t(`status.${item.status}`)}
              </small>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
