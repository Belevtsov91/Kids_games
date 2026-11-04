import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@/styles/index.css';
import { waitForServer } from '@/wake/serverStatus';

// Сразу будим сервер: он мог уснуть, пока никого не было. Пока спит — поверх сайта мишка (WakeGate).
void waitForServer('start');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
