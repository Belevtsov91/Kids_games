import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '@/api/client';
import { SiteTopbar } from '@/info/components/SiteTopbar';
import { useMoreText } from '../text';

type Result = { status: 'approved' | 'denied' | 'gone'; name?: string; minutes?: number };

/** /answer#<токен>: кнопка «Разрешить» или «Не сегодня» из письма. Вход не нужен — токен подписан сервером. */
export function AnswerPage() {
  const a = useMoreText().answer;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const token = location.hash.slice(1);
    // Токен из адреса убираем: в истории браузера его не будет.
    history.replaceState(null, '', location.pathname);
    if (!token) return setResult({ status: 'gone' });
    api.post<Result>('/answer', { token }).then(setResult, () => setResult({ status: 'gone' }));
  }, []);

  const text = !result
    ? a.working
    : result.status === 'approved'
      ? a.approved(result.name ?? '', result.minutes ?? 0)
      : result.status === 'denied'
        ? a.denied(result.name ?? '')
        : a.gone;

  return (
    <main className="wl more-page">
      <SiteTopbar />
      <section className="wl-wrap more-card">
        <span className="more-icon" aria-hidden="true">{result?.status === 'approved' ? '✅' : result?.status === 'denied' ? '🌙' : '📬'}</span>
        <h1>{a.title}</h1>
        <p role="status">{text}</p>
        <Link to="/parent" className="wl-btn wl-btn-primary">{a.toParent}</Link>
      </section>
    </main>
  );
}
