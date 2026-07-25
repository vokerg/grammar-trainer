import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell.js';
import { HistoryPage } from './routes/history-page.js';
import { ResultPage } from './routes/result-page.js';
import { TrainingPage } from './routes/training-page.js';
import { WritePage } from './routes/write-page.js';
import { VocabularyPage } from './routes/vocabulary-page.js';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<WritePage />} />
        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>
    </Routes>
  );
}
