import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { I18nProvider } from './i18n';
import { FeedbackProvider } from './ui/feedback';
import { applyTheme, savedTheme } from './app/theme';
import './styles/base.css';
import './styles/layout.css';
import './styles/content.css';

applyTheme(savedTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </I18nProvider>
  </StrictMode>,
);
