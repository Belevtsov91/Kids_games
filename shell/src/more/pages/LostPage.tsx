import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { SiteTopbar } from '@/info/components/SiteTopbar';
import { useMoreText } from '../text';

/** 404: вместо молчаливого перехода на главную — заблудившийся мишка и две большие кнопки. */
export function LostPage() {
  const l = useMoreText().lost;
  const { me } = useAuth();
  return (
    <main className="wl more-page">
      <SiteTopbar />
      <section className="wl-wrap more-card">
        <span className="more-icon more-float" aria-hidden="true">🐻☁️</span>
        <h1>{l.title}</h1>
        <p>{l.lead}</p>
        <div className="more-actions">
          <Link to="/" className="wl-btn wl-btn-ghost">{l.home}</Link>
          {me && <Link to="/dashboard" className="wl-btn wl-btn-primary">{l.games}</Link>}
        </div>
      </section>
    </main>
  );
}

/** Нет сети, а без сервера не узнать, кто вошёл. Игры, которые уже скачаны, откроются после возврата сети. */
export function OfflineScreen() {
  const o = useMoreText().offline;
  return (
    <main className="wl more-page">
      <section className="wl-wrap more-card">
        <span className="more-icon" aria-hidden="true">📡</span>
        <h1>{o.title}</h1>
        <p>{o.lead}</p>
        <button type="button" className="wl-btn wl-btn-primary" onClick={() => location.reload()}>{o.retry}</button>
      </section>
    </main>
  );
}
