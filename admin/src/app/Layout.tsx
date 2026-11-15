import { useState, type ReactNode } from 'react';
import { post } from '../api/client';
import type { Me } from '../api/types';
import { useI18n, type Key } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { navigate } from './router';

// Каркас: меню слева (на телефоне — нижняя панель и «Ещё»), шапка с переключателем «только чтение» и выходом.

export const NAV: { path: string; key: Key }[] = [
  { path: '/', key: 'nav.home' },
  { path: '/health', key: 'nav.health' },
  { path: '/families', key: 'nav.families' },
  { path: '/games', key: 'nav.games' },
  { path: '/mail', key: 'nav.mail' },
  { path: '/errors', key: 'nav.errors' },
  { path: '/security', key: 'nav.security' },
  { path: '/retention', key: 'nav.retention' },
  { path: '/site', key: 'nav.site' },
  { path: '/prefs', key: 'nav.prefs' },
];
const TABS = ['/', '/health', '/families', '/errors'];

const section = (path: string) => (path.startsWith('/families') ? '/families' : NAV.some((n) => n.path === path) ? path : '/');

export function Layout({ me, path, children, refreshMe, onLogout }: { me: Me; path: string; children: ReactNode; refreshMe: () => Promise<void>; onLogout: () => void }) {
  const { t } = useI18n();
  const { run } = useFeedback();
  const [menu, setMenu] = useState(false);
  const current = section(path);
  const go = (to: string) => {
    setMenu(false);
    navigate(to);
  };

  const toggleReadonly = async (on: boolean) => {
    await run(() => post('/site/readonly', { on }), on ? 'readonly.on' : 'readonly.off');
    await refreshMe();
  };
  const logout = async () => {
    await post('/auth/logout').catch(() => undefined);
    onLogout();
  };

  return (
    <div className="app">
      <aside className={`rail${menu ? ' open' : ''}`}>
        <div className="brand">{t('brand')}<small>{t('brand.sub')}</small></div>
        {NAV.map((n) => (
          <button key={n.path} className={`nav${current === n.path ? ' on' : ''}`} onClick={() => go(n.path)}>{t(n.key)}</button>
        ))}
      </aside>
      <div className="main">
        {me.readonly && <div className="ro-banner">{t('readonly.banner')}</div>}
        <header className="top">
          <h1>{t(NAV.find((n) => n.path === current)!.key)}</h1>
          <label className="sw">
            <input type="checkbox" id="readonly-switch" checked={me.readonly} onChange={(e) => void toggleReadonly(e.target.checked)} /> {t('readonly')}
          </label>
          <button className="btn sm" onClick={() => void logout()}>{t('logout')}</button>
        </header>
        <main className="page">{children}</main>
      </div>
      <nav className="tabs">
        {TABS.map((p) => (
          <button key={p} className={current === p && !menu ? 'on' : ''} onClick={() => go(p)}>{t(NAV.find((n) => n.path === p)!.key)}</button>
        ))}
        <button className={menu ? 'on' : ''} onClick={() => setMenu(!menu)}>{t('more')}</button>
      </nav>
    </div>
  );
}
