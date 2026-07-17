import type { z } from 'zod';
import { ApiMistakeSchema } from '@grammar/shared';

type ApiMistake = z.infer<typeof ApiMistakeSchema>;

export function MistakeCard({ mistake }: { mistake: ApiMistake }) {
  return (
    <article className="mistake-card">
      <p className="correction">
        <span>{mistake.original}</span>
        <span aria-hidden="true">→</span>
        <strong>{mistake.correct}</strong>
      </p>
      <p>{mistake.explanation}</p>
      <div className="tag-row">
        <span className="tag">{mistake.category}</span>
        {mistake.addedToTraining ? <span className="tag success">Tilføjet til træning</span> : null}
      </div>
    </article>
  );
}
