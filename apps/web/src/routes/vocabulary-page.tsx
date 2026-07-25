import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteVocabularyItem, getVocabulary } from '../api/training.js';
import { ErrorMessage } from '../components/error-message.js';
import { LoadingState } from '../components/loading-state.js';
import { useI18n } from '../i18n.js';

export function VocabularyPage() {
  const { language, t } = useI18n();
  const queryClient = useQueryClient();
  const vocabulary = useQuery({
    queryKey: ['vocabulary', language],
    queryFn: () => getVocabulary(language),
  });
  const remove = useMutation({
    mutationFn: deleteVocabularyItem,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vocabulary', language] }),
        queryClient.invalidateQueries({ queryKey: ['training-session', language] }),
        queryClient.invalidateQueries({ queryKey: ['training-stats', language] }),
      ]);
    },
  });

  if (vocabulary.isPending) return <LoadingState label={t('vocabulary.loading')} />;
  if (vocabulary.isError || vocabulary.data === undefined) {
    return (
      <section className="page">
        <ErrorMessage message={t('vocabulary.loadError')} />
      </section>
    );
  }

  return (
    <section className="page narrow-page">
      <p className="eyebrow">{t('vocabulary.eyebrow')}</p>
      <h1>{t('vocabulary.title')}</h1>
      <p>{t('vocabulary.intro')}</p>
      {remove.isError ? <ErrorMessage message={t('vocabulary.removeError')} /> : null}
      {vocabulary.data.items.length === 0 ? (
        <div className="empty-state">
          <p>{t('vocabulary.empty')}</p>
        </div>
      ) : (
        <div className="vocabulary-list">
          {vocabulary.data.items.map((item) => (
            <article className="vocabulary-item" key={item.id}>
              <div>
                <span className="tag">{t(`category.${item.category}`)}</span>
                <p className="vocabulary-original">{item.original}</p>
                <p className="vocabulary-correct">{item.correct}</p>
                <small>
                  {t('vocabulary.practised', { correct: item.timesCorrect, total: item.timesSeen })}
                </small>
              </div>
              <button
                className="remove-button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(item.id)}
              >
                {t('vocabulary.remove')}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
