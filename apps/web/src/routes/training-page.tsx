import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { answerTrainingItem, getTrainingSession, getTrainingStats } from '../api/training.js';
import { ErrorMessage } from '../components/error-message.js';
import { LoadingState } from '../components/loading-state.js';
import { WordMascot } from '../components/word-mascot.js';
import { useKeyboardOptions } from '../hooks/use-keyboard-options.js';
import { useI18n } from '../i18n.js';

export function TrainingPage() {
  const { language, t } = useI18n();
  const session = useQuery({
    queryKey: ['training-session', language],
    queryFn: () => getTrainingSession(language),
  });
  const stats = useQuery({
    queryKey: ['training-stats', language],
    queryFn: () => getTrainingStats(language),
  });
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const answer = useMutation({
    mutationFn: ({ itemId, option }: { itemId: string; option: string }) =>
      answerTrainingItem(itemId, option),
    onSuccess: (result) => {
      setCorrectAnswer(result.correctAnswer);
      if (result.wasCorrect) setCorrectCount((count) => count + 1);
    },
  });
  useEffect(() => {
    setIndex(0);
    setSelected(null);
    setCorrectAnswer(null);
    setCorrectCount(0);
  }, [language]);
  const current = session.data?.items[index];
  const selectOption = useCallback(
    (optionIndex: number) => {
      if (current === undefined || selected !== null || answer.isPending) return;
      const option = current.options[optionIndex];
      if (option === undefined) return;
      setSelected(option);
      answer.mutate({ itemId: current.id, option });
    },
    [answer, current, selected],
  );
  useKeyboardOptions(current !== undefined && selected === null, selectOption);

  if (session.isPending) return <LoadingState label={t('training.loading')} />;
  if (session.isError || session.data === undefined)
    return (
      <section className="page">
        <ErrorMessage message={t('training.loadError')} />
      </section>
    );
  if (session.data.items.length === 0) {
    return (
      <section className="page narrow-page center-card empty-training-card">
        <WordMascot compact />
        <h1>{t('training.emptyTitle')}</h1>
        <p>{t('training.emptyBody')}</p>
      </section>
    );
  }
  if (current === undefined) {
    const total = session.data.items.length;
    return (
      <section className="page narrow-page center-card completion-card">
        <WordMascot compact />
        <p className="eyebrow">{t('training.finished')}</p>
        <h1>{t('training.title')}</h1>
        <p className="score">{t('training.score', { correct: correctCount, total })}</p>
        <p>{t('training.summary')}</p>
        <button className="primary-button" onClick={() => window.location.reload()}>
          {t('training.again')}
        </button>
      </section>
    );
  }

  const wasCorrect = answer.data?.wasCorrect ?? false;
  return (
    <section className="page narrow-page training-page">
      <div className="training-topline">
        <span>
          {index + 1} / {session.data.items.length}
        </span>
        <span>{t('training.active', { count: stats.data?.activeItems ?? session.data.items.length })}</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${((index + 1) / session.data.items.length) * 100}%` }} />
      </div>
      <article className="training-card">
        <p className="eyebrow">{t(`category.${current.category}`)}</p>
        <h1>{current.prompt}</h1>
        <div className="option-grid context-options">
          {current.options.map((option, optionIndex) => {
            const isSelected = selected === option;
            const isCorrect = correctAnswer === option;
            const stateClass =
              correctAnswer === null
                ? ''
                : isCorrect
                  ? ' correct-option'
                  : isSelected
                    ? ' selected-wrong'
                    : '';
            return (
              <button
                key={option}
                className={`option-button${stateClass}`}
                disabled={selected !== null}
                onClick={() => selectOption(optionIndex)}
                aria-label={t('training.answer', { number: optionIndex + 1, option })}
              >
                <span>{optionIndex + 1}</span>
                <span className="option-text">{option}</span>
              </button>
            );
          })}
        </div>
        <div className="answer-feedback" aria-live="polite">
          {correctAnswer === null ? (
            <p>{t('training.keyboard')}</p>
          ) : wasCorrect ? (
            <p>
              <strong>{t('training.correct')}</strong> {t('training.correctBody', { answer: correctAnswer })}
            </p>
          ) : (
            <p>
              <strong>{t('training.wrong')}</strong> {t('training.correctBody', { answer: correctAnswer })}
            </p>
          )}
        </div>
        {correctAnswer === null ? null : (
          <button
            className="primary-button"
            onClick={() => {
              setIndex((value) => value + 1);
              setSelected(null);
              setCorrectAnswer(null);
              answer.reset();
            }}
          >
            {t('training.next')}
          </button>
        )}
      </article>
    </section>
  );
}
