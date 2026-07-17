import type { z } from 'zod';
import type { ApiMistakeSchema, TrainingReason } from '@grammar/shared';
import { useI18n } from '../i18n.js';

type ApiMistake = z.infer<typeof ApiMistakeSchema>;

function fallbackReason(mistake: ApiMistake): Exclude<TrainingReason, 'added'> {
  if (mistake.category === 'capitalization') return 'capitalization-excluded';
  if (mistake.trainable) return 'missing-context';
  return 'model-not-trainable';
}

export function MistakeCard({ mistake }: { mistake: ApiMistake }) {
  const { t } = useI18n();
  const reason = mistake.trainingReason ?? fallbackReason(mistake);
  return (
    <article className="mistake-card">
      <p className="correction">
        <span>{mistake.original}</span>
        <span aria-hidden="true">→</span>
        <strong>{mistake.correct}</strong>
      </p>
      <p>{mistake.explanation}</p>
      <div className="tag-row">
        <span className="tag">{t(`category.${mistake.category}`)}</span>
        {mistake.addedToTraining ? (
          <span className="tag success">{t('mistake.added')}</span>
        ) : (
          <span className="tag muted">{t('mistake.notAdded')}</span>
        )}
      </div>
      {mistake.addedToTraining ? null : (
        <p className="training-reason">{t(`reason.${reason}`)}</p>
      )}
    </article>
  );
}
