import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSubmission, retrySubmission } from '../api/submissions.js';
import { ErrorMessage } from '../components/error-message.js';
import { LoadingState } from '../components/loading-state.js';
import { MistakeCard } from '../components/mistake-card.js';
import { WordMascot } from '../components/word-mascot.js';
import { useI18n } from '../i18n.js';

export function ResultPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { setLanguage, t } = useI18n();
  const query = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmission(id),
    enabled: id.length > 0,
  });
  useEffect(() => {
    if (query.data !== undefined) setLanguage(query.data.language);
  }, [query.data, setLanguage]);
  const retry = useMutation({
    mutationFn: () => retrySubmission(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['submission', id] }),
  });

  if (query.isPending) return <LoadingState label={t('result.loading')} />;
  if (query.isError || query.data === undefined) {
    return (
      <section className="page">
        <ErrorMessage message={t('result.loadError')} />
      </section>
    );
  }

  const result = query.data.latestAnalysis;
  if (result === null || result.status === 'pending') return <LoadingState />;
  if (result.status === 'failed' || result.analysis === undefined) {
    return (
      <section className="page narrow-page">
        <h1>{t('result.savedTitle')}</h1>
        <ErrorMessage message={t('result.savedBody')} />
        <div className="action-row">
          <button
            className="primary-button"
            onClick={() => retry.mutate()}
            disabled={retry.isPending}
          >
            {t('result.retry')}
          </button>
          <Link className="secondary-button" to="/">
            {t('result.new')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page result-page">
      <div className="result-heading">
        <div>
          <p className="eyebrow">{t('result.eyebrow')}</p>
          <h1>{t('result.title')}</h1>
        </div>
        <WordMascot compact />
      </div>
      <article className="feedback-card highlight-card">
        <h2>{t('result.positive')}</h2>
        <p>{result.analysis.overallFeedback}</p>
      </article>
      <div className="two-column">
        <article className="feedback-card">
          <h2>{t('result.original')}</h2>
          <p className="preserve-lines">{query.data.text}</p>
        </article>
        <article className="feedback-card">
          <h2>{t('result.corrected')}</h2>
          <p className="preserve-lines">{result.analysis.correctedText}</p>
        </article>
      </div>
      {result.analysis.styleFeedback.length > 0 ? (
        <article className="feedback-card">
          <h2>{t('result.style')}</h2>
          <ul>
            {result.analysis.styleFeedback.map((feedback) => (
              <li key={feedback}>{feedback}</li>
            ))}
          </ul>
        </article>
      ) : null}
      <article className="feedback-card training-info-card">
        <div className="info-icon" aria-hidden="true">
          ✦
        </div>
        <div>
          <h2>{t('result.howTitle')}</h2>
          <p>{t('result.howBody')}</p>
        </div>
      </article>
      <section aria-labelledby="mistakes-heading">
        <h2 id="mistakes-heading">{t('result.mistakes')}</h2>
        {result.analysis.mistakes.length === 0 ? (
          <p className="empty-state">{t('result.none')}</p>
        ) : (
          <div className="mistake-grid">
            {result.analysis.mistakes.map((mistake) => (
              <MistakeCard key={mistake.id} mistake={mistake} />
            ))}
          </div>
        )}
      </section>
      <div className="action-row">
        <Link className="primary-button" to="/training">
          {t('result.startTraining')}
        </Link>
        <Link className="secondary-button" to="/">
          {t('result.new')}
        </Link>
      </div>
    </section>
  );
}
