import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';

/** Верхняя панель для страниц, открытых всем: гостю — вход и регистрация, вошедшему — назад к играм. */
export function SiteTopbar() {
  const { me } = useAuth();
  const { t } = useI18n();
  return (
    <header className="wl-topbar">
      <div className="wl-wrap">
        <Link to="/" className="wl-logo">
          <span className="wl-logo-mark" aria-hidden="true">🐻</span>
          Interact Games
        </Link>
        <nav className="wl-nav">
          {me ? (
            <Link to="/dashboard" className="wl-btn wl-btn-primary wl-btn-sm">{t.common.toGames}</Link>
          ) : (
            <>
              <Link to="/login" className="wl-btn wl-btn-ghost wl-btn-sm wl-hide-phone">{t.common.login}</Link>
              <Link to="/register" className="wl-btn wl-btn-primary wl-btn-sm">{t.common.register}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
