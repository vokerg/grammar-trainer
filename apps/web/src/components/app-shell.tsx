import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet } from 'react-router-dom';
import { getPublicConfig } from '../api/config.js';

export function AppShell() {
  const config = useQuery({ queryKey: ['config'], queryFn: getPublicConfig, staleTime: Infinity });
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand" to="/">Ordværkstedet</NavLink>
        <nav aria-label="Hovedmenu">
          <NavLink to="/">Skriv</NavLink>
          <NavLink to="/training">Træn</NavLink>
          <NavLink to="/history">Historik</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        {config.data === undefined
          ? 'Sproganalyse: indlæser…'
          : `Sproganalyse: ${config.data.localMode ? 'lokal model' : 'ekstern model'} · ${config.data.llmModel}`}
      </footer>
    </div>
  );
}
