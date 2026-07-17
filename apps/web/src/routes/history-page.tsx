import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSubmissionHistory } from '../api/submissions.js';
import { ErrorMessage } from '../components/error-message.js';
import { LoadingState } from '../components/loading-state.js';

export function HistoryPage() {
  const query = useQuery({ queryKey: ['submission-history'], queryFn: getSubmissionHistory });
  if (query.isPending) return <LoadingState label="Henter historikken…" />;
  if (query.isError || query.data === undefined)
    return (
      <section className="page">
        <ErrorMessage message="Historikken kunne ikke hentes." />
      </section>
    );
  return (
    <section className="page narrow-page">
      <p className="eyebrow">Dine tekster</p>
      <h1>Historik</h1>
      {query.data.items.length === 0 ? (
        <p className="empty-state">Du har ikke gemt nogen tekster endnu.</p>
      ) : (
        <div className="history-list">
          {query.data.items.map((item) => (
            <Link to={`/result/${item.id}`} key={item.id} className="history-item">
              <span>{item.textPreview}</span>
              <small>
                {new Date(item.createdAt).toLocaleDateString()} · {item.language} ·{' '}
                {item.status ?? 'ukendt'}
              </small>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
