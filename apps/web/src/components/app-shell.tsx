import { useQuery } from '@tanstack/react-query';
import { supportedLanguages, type SupportedLanguage } from '@grammar/shared';
import { NavLink, Outlet } from 'react-router-dom';
import { getPublicConfig } from '../api/config.js';
import { languageNames, useI18n } from '../i18n.js';

export function AppShell() {
  const config = useQuery({ queryKey: ['config'], queryFn: getPublicConfig, staleTime: Infinity });
  const { language, setLanguage, t } = useI18n();
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          {t('brand')}
        </NavLink>
        <div className="header-actions">
          <nav aria-label={t('nav.main')}>
            <NavLink to="/">{t('nav.write')}</NavLink>
            <NavLink to="/training">{t('nav.training')}</NavLink>
            <NavLink to="/history">{t('nav.history')}</NavLink>
          </nav>
          <label className="language-switcher">
            <span className="sr-only">{t('language.label')}</span>
            <select
              value={language}
              aria-label={t('language.label')}
              onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
            >
              {supportedLanguages.map((option) => (
                <option key={option} value={option}>
                  {languageNames[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        {config.data === undefined
          ? t('provider.loading')
          : `${t('language.label')}: ${config.data.localMode ? t('provider.local') : t('provider.remote')} · ${config.data.llmModel}`}
      </footer>
    </div>
  );
}
