import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@fontsource-variable/nunito/wght.css';
import '@/styles/index.css';
import { waitForServer } from '@/wake/serverStatus';
import { startMotion } from '@/lib/motion';

// Сразу будим сервер: он мог уснуть, пока никого не было. Пока спит — поверх сайта мишка (WakeGate).
void waitForServer('start');

// Свечение за курсором и наклон карточек: только на компьютерах с мышью.
startMotion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
