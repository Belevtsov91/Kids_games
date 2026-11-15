import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { useI18n } from '@/i18n/I18nProvider';
import { INFO_SLUGS } from '@/info/types';
import { bannerText } from './flags';
import { useSiteFlags } from './SiteFlags';
import { useSiteText } from './text';

/** Документы (политика, условия, контакты) открыты и во время обслуживания: их могут искать родители. */
const OPEN_PATHS = new Set(INFO_SLUGS.map((slug) => `/${slug}`));

/** Режим обслуживания закрывает сайт заглушкой; объявление показывает полосой сверху. */
export function SiteGate({ children }: { children: ReactNode }) {
  const { maintenance } = useSiteFlags();
  const { pathname } = useLocation();
  if (maintenance && !OPEN_PATHS.has(pathname)) return <MaintenanceScreen />;
  return (
    <>
      <SiteBanner />
      {children}
    </>
  );
}

function MaintenanceScreen() {
  const s = useSiteText();
  const { refresh } = useSiteFlags();
  const [checking, setChecking] = useState(false);
  const check = async () => {
    setChecking(true);
    await refresh();
    setChecking(false);
  };
  return (
    <main className="kid-rest site-maintenance">
      <div className="kid-rest-card" role="status">
        <span className="kid-rest-bear" aria-hidden="true">🧸</span>
        <h1>{s.maintenanceTitle}</h1>
        <p>{s.maintenanceText}</p>
        <p className="site-maintenance-note">{s.maintenanceParents}</p>
        <button type="button" className="dash-btn dash-btn-primary" onClick={() => void check()} disabled={checking}>
          {s.retry}
        </button>
      </div>
    </main>
  );
}

function SiteBanner() {
  const { banner } = useSiteFlags();
  const { locale } = useI18n();
  const s = useSiteText();
  const text = bannerText(banner, locale);
  const [closed, setClosed] = useState<string | null>(() => readClosed());
  if (!text || closed === text) return null;
  const close = () => {
    setClosed(text);
    try {
      sessionStorage.setItem(CLOSED_KEY, text);
    } catch {
      /* хранилище недоступно: просто скрываем до перезагрузки */
    }
  };
  return (
    <div className="site-banner" role="status">
      <p>{text}</p>
      <button type="button" onClick={close} aria-label={s.close}>✕</button>
    </div>
  );
}

const CLOSED_KEY = 'ig:site-banner-closed';
function readClosed(): string | null {
  try {
    return sessionStorage.getItem(CLOSED_KEY);
  } catch {
    return null;
  }
}
