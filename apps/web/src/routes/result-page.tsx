import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getSubmission, retrySubmission } from '../api/submissions.js';
import { ErrorMessage } from '../components/error-message.js';
import { LoadingState } from '../components/loading-state.js';
import { MistakeCard } from '../components/mistake-card.js';

export function ResultPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['submission', id], queryFn: () => getSubmission(id), enabled: id.length > 0 });
  const retry = useMutation({
    mutationFn: () => retrySubmission(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['submission', id] }),
  });

  if (query.isPending) return <LoadingState label="Henter din feedback…" />;
  if (query.isError || query.data === undefined) {
    return <section className="page"><ErrorMessage message="Resultatet kunne ikke hentes." /></section>;
  }

  const result = query.data.latestAnalysis;
  if (result === null || result.status === 'pending') return <LoadingState />;
  if (result.status === 'failed' || result.analysis === undefined) {
    return (
      <section className="page narrow-page">
        <h1>Din tekst er gemt</h1>
        <ErrorMessage message="Sproganalysen blev ikke færdig, men du har ikke mistet din tekst." />
        <div className="action-row">
          <button className="primary-button" onClick={() => retry.mutate()} disabled={retry.isPending}>
            Prøv analysen igen
          </button>
          <Link className="secondary-button" to="/">Skriv en ny tekst</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page result-page">
      <p className="eyebrow">Din feedback</p>
      <h1>Godt skrevet</h1>
      <article className="feedback-card highlight-card">
        <h2>Det gjorde du godt</h2>
        <p>{result.analysis.overallFeedback}</p>
      </article>
      <div className="two-column">
        <article className="feedback-card">
          <h2>Din tekst</h2>
          <p className="preserve-lines">{query.data.text}</p>
        </article>
        <article className="feedback-card">
          <h2>Forslag til rettet tekst</h2>
          <p className="preserve-lines">{result.analysis.correctedText}</p>
        </article>
      </div>
      {result.analysis.styleFeedback.length > 0 ? (
        <article className="feedback-card">
          <h2>Stiltips</h2>
          <ul>{result.analysis.styleFeedback.map((feedback) => <li key={feedback}>{feedback}</li>)}</ul>
        </article>
      ) : null}
      <section aria-labelledby="mistakes-heading">
        <h2 id="mistakes-heading">Ord og udtryk at øve</h2>
        {result.analysis.mistakes.length === 0 ? (
          <p className="empty-state">Vi fandt ingen tydelige fejl i denne tekst.</p>
        ) : (
          <div className="mistake-grid">{result.analysis.mistakes.map((mistake) => <MistakeCard key={mistake.id} mistake={mistake} />)}</div>
        )}
      </section>
      <div className="action-row">
        <Link className="primary-button" to="/training">Start træning</Link>
        <Link className="secondary-button" to="/">Skriv en ny tekst</Link>
      </div>
    </section>
  );
}
