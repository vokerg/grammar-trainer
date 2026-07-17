import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { answerTrainingItem, getTrainingSession, getTrainingStats } from '../api/training.js';
import { ErrorMessage } from '../components/error-message.js';
import { LoadingState } from '../components/loading-state.js';
import { useKeyboardOptions } from '../hooks/use-keyboard-options.js';

export function TrainingPage() {
  const session = useQuery({ queryKey: ['training-session', 'da'], queryFn: () => getTrainingSession('da') });
  const stats = useQuery({ queryKey: ['training-stats', 'da'], queryFn: () => getTrainingStats('da') });
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const answer = useMutation({
    mutationFn: ({ itemId, option }: { itemId: string; option: string }) => answerTrainingItem(itemId, option),
    onSuccess: (result) => {
      setCorrectAnswer(result.correctAnswer);
      if (result.wasCorrect) setCorrectCount((count) => count + 1);
    },
  });
  const current = session.data?.items[index];
  const selectOption = useCallback((optionIndex: number) => {
    const option = current?.options[optionIndex];
    if (option === undefined || selected !== null || answer.isPending) return;
    setSelected(option);
    answer.mutate({ itemId: current.id, option });
  }, [answer, current, selected]);
  useKeyboardOptions(current !== undefined && selected === null, selectOption);

  if (session.isPending) return <LoadingState label="Finder dine øveord…" />;
  if (session.isError || session.data === undefined) return <section className="page"><ErrorMessage message="Træningen kunne ikke hentes." /></section>;
  if (session.data.items.length === 0) {
    return (
      <section className="page narrow-page center-card">
        <h1>Ingen øveord endnu</h1>
        <p>Skriv en tekst først. Gode stave- og udtryksfejl bliver automatisk til øvelser.</p>
      </section>
    );
  }
  if (current === undefined) {
    const total = session.data.items.length;
    return (
      <section className="page narrow-page center-card">
        <p className="eyebrow">Træningen er færdig</p>
        <h1>Flot arbejde</h1>
        <p className="score">{correctCount} af {total} rigtige</p>
        <p>Du øvede dig hele vejen igennem. Det er sådan, ord bliver lettere.</p>
        <button className="primary-button" onClick={() => window.location.reload()}>Træn igen</button>
      </section>
    );
  }

  const wasCorrect = answer.data?.wasCorrect ?? false;
  return (
    <section className="page narrow-page training-page">
      <div className="training-topline">
        <span>{index + 1} / {session.data.items.length}</span>
        <span>{stats.data?.activeItems ?? session.data.items.length} aktive ord</span>
      </div>
      <div className="progress-track" aria-hidden="true"><span style={{ width: `${((index + 1) / session.data.items.length) * 100}%` }} /></div>
      <article className="training-card">
        <p className="eyebrow">{current.category}</p>
        <h1>{current.prompt}</h1>
        <div className="option-grid">
          {current.options.map((option, optionIndex) => {
            const isSelected = selected === option;
            const isCorrect = correctAnswer === option;
            const stateClass = correctAnswer === null ? '' : isCorrect ? ' correct-option' : isSelected ? ' selected-wrong' : '';
            return (
              <button
                key={option}
                className={`option-button${stateClass}`}
                disabled={selected !== null}
                onClick={() => selectOption(optionIndex)}
                aria-label={`Svar ${optionIndex + 1}: ${option}`}
              >
                <span>{optionIndex + 1}</span>{option}
              </button>
            );
          })}
        </div>
        <div className="answer-feedback" aria-live="polite">
          {correctAnswer === null ? <p>Du kan også bruge tasterne 1–4.</p> : wasCorrect ? (
            <p><strong>Ja — godt set!</strong> “{correctAnswer}” er den korrekte form.</p>
          ) : (
            <p><strong>Godt forsøgt.</strong> Det rigtige svar er “{correctAnswer}”.</p>
          )}
        </div>
        {correctAnswer === null ? null : (
          <button className="primary-button" onClick={() => { setIndex((value) => value + 1); setSelected(null); setCorrectAnswer(null); answer.reset(); }}>
            Næste ord
          </button>
        )}
      </article>
    </section>
  );
}
