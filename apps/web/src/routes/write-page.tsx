import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  CreateSubmissionRequestSchema,
  SupportedLanguageSchema,
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
import { WordMascot } from '../components/word-mascot.js';
import { useLocalDraft } from '../hooks/use-local-draft.js';
import { languageNames, useI18n } from '../i18n.js';

export function WritePage() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const [draft, setDraft, clearDraft] = useLocalDraft();
  const form = useForm<CreateSubmissionRequest>({
    resolver: zodResolver(CreateSubmissionRequestSchema),
    defaultValues: { text: draft, language },
  });
  const text = form.watch('text');
  useEffect(() => setDraft(text), [setDraft, text]);
  useEffect(() => form.setValue('language', language), [form, language]);
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
        ? t('write.timeout')
        : t('write.failed')
      : mutation.error instanceof Error
        ? mutation.error.message
        : null;
  const languageField = form.register('language');

  return (
    <section className="page write-page">
      <div className="hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">{t('write.eyebrow')}</p>
          <h1>{t('write.title')}</h1>
          <p>{t('write.intro')}</p>
          <div className="idea-chips" aria-hidden="true">
            <span>✎</span>
            <span>ABC</span>
            <span>?!</span>
          </div>
        </div>
        <WordMascot />
      </div>
      <form
        className="editor-card"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="editor-toolbar">
          <label htmlFor="language">{t('language.label')}</label>
          <select
            id="language"
            {...languageField}
            onChange={(event) => {
              void languageField.onChange(event);
              const parsed = SupportedLanguageSchema.safeParse(event.target.value);
              if (parsed.success) setLanguage(parsed.data);
            }}
          >
            {supportedLanguages.map((option) => (
              <option key={option} value={option}>
                {languageNames[option]}
              </option>
            ))}
          </select>
        </div>
        <label className="sr-only" htmlFor="writing-text">
          {t('write.textLabel')}
        </label>
        <textarea
          id="writing-text"
          rows={14}
          placeholder={t('write.placeholder')}
          aria-invalid={form.formState.errors.text !== undefined}
          {...form.register('text')}
        />
        <div className="editor-footer">
          <span>
            {t('write.words', { count: words })} · {t('write.characters', { count: text.length })}
          </span>
          <button className="primary-button" type="submit" disabled={mutation.isPending}>
            {t('write.submit')}
          </button>
        </div>
        {form.formState.errors.text?.message === undefined ? null : (
          <p className="field-error" role="alert">
            {t('write.short')}
          </p>
        )}
      </form>
      {mutation.isPending ? <LoadingState /> : null}
      {errorMessage === null ? null : <ErrorMessage message={errorMessage} />}
    </section>
  );
}
