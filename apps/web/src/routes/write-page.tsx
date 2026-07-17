import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  CreateSubmissionRequestSchema,
  supportedLanguages,
  type CreateSubmissionRequest,
} from '@grammar/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { createSubmission } from '../api/submissions.js';
import { ApiClientError } from '../api/client.js';
import { ErrorMessage } from '../components/error-message.js';
import { LoadingState } from '../components/loading-state.js';
import { useLocalDraft } from '../hooks/use-local-draft.js';

const languageNames: Record<(typeof supportedLanguages)[number], string> = {
  da: 'Dansk',
  en: 'English',
  de: 'Deutsch',
  sv: 'Svenska',
  no: 'Norsk',
};

export function WritePage() {
  const navigate = useNavigate();
  const [draft, setDraft, clearDraft] = useLocalDraft();
  const form = useForm<CreateSubmissionRequest>({
    resolver: zodResolver(CreateSubmissionRequestSchema),
    defaultValues: { text: draft, language: 'da' },
  });
  const text = form.watch('text');
  useEffect(() => setDraft(text), [setDraft, text]);
  const mutation = useMutation({
    mutationFn: createSubmission,
    onSuccess: (result) => {
      clearDraft();
      void navigate(`/result/${result.submissionId}`);
    },
  });
  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  const errorMessage =
    mutation.error instanceof ApiClientError
      ? mutation.error.code === 'LLM_TIMEOUT'
        ? 'Sprogmodellen brugte for lang tid. Din tekst er gemt, og du kan prøve analysen igen.'
        : 'Din tekst er gemt, men sproganalysen mislykkedes. Prøv igen fra resultatsiden.'
      : mutation.error instanceof Error
        ? mutation.error.message
        : null;

  return (
    <section className="page write-page">
      <div className="hero-copy">
        <p className="eyebrow">Skriv · lær · prøv igen</p>
        <h1>Skriv med dine egne ord</h1>
        <p>Fortæl om noget, du har oplevet, lært eller tænkt på.</p>
      </div>
      <form
        className="editor-card"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="editor-toolbar">
          <label htmlFor="language">Sprog</label>
          <select id="language" {...form.register('language')}>
            {supportedLanguages.map((language) => (
              <option key={language} value={language}>
                {languageNames[language]}
              </option>
            ))}
          </select>
        </div>
        <label className="sr-only" htmlFor="writing-text">
          Din tekst
        </label>
        <textarea
          id="writing-text"
          rows={14}
          placeholder="Begynd din tekst her…"
          aria-invalid={form.formState.errors.text !== undefined}
          {...form.register('text')}
        />
        <div className="editor-footer">
          <span>
            {words} ord · {text.length} tegn
          </span>
          <button className="primary-button" type="submit" disabled={mutation.isPending}>
            Tjek min tekst
          </button>
        </div>
        {form.formState.errors.text?.message === undefined ? null : (
          <p className="field-error" role="alert">
            {form.formState.errors.text.message}
          </p>
        )}
      </form>
      {mutation.isPending ? <LoadingState /> : null}
      {errorMessage === null ? null : <ErrorMessage message={errorMessage} />}
    </section>
  );
}
