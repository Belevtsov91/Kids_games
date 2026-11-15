import { useCallback, useEffect, useState } from 'react';
import { get, setUnauthorizedHandler } from '../api/client';
import type { Me } from '../api/types';
import { Layout } from './Layout';
import { LoginPage } from '../pages/LoginPage';
import { usePath } from './router';
import { HomePage } from '../pages/HomePage';
import { HealthPage } from '../pages/HealthPage';
import { FamiliesPage } from '../pages/FamiliesPage';
import { FamilyPage } from '../pages/FamilyPage';
import { GamesPage } from '../pages/GamesPage';
import { MailPage } from '../pages/MailPage';
import { ErrorsPage } from '../pages/ErrorsPage';
import { SecurityPage } from '../pages/SecurityPage';
import { RetentionPage } from '../pages/RetentionPage';
import { SitePage } from '../pages/SitePage';
import { PrefsPage } from '../pages/PrefsPage';

/** Раздел по пути. Неизвестный путь — главная. */
function Page({ path, me, refreshMe }: { path: string; me: Me; refreshMe: () => Promise<void> }) {
  const family = /^\/families\/([0-9a-f-]{36})$/i.exec(path);
  if (family) return <FamilyPage id={family[1]} />;
  switch (path) {
    case '/health': return <HealthPage />;
    case '/families': return <FamiliesPage />;
    case '/games': return <GamesPage />;
    case '/mail': return <MailPage />;
    case '/errors': return <ErrorsPage />;
    case '/security': return <SecurityPage me={me} />;
    case '/retention': return <RetentionPage />;
    case '/site': return <SitePage refreshMe={refreshMe} />;
    case '/prefs': return <PrefsPage me={me} />;
    default: return <HomePage />;
  }
}

export function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const path = usePath();

  const refreshMe = useCallback(async () => {
    try {
      setMe(await get<Me>('/auth/me'));
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setMe(null));
    void refreshMe();
  }, [refreshMe]);

  if (me === undefined) return null;
  if (!me) return <LoginPage onDone={refreshMe} />;
  return (
    <Layout me={me} path={path} refreshMe={refreshMe} onLogout={() => setMe(null)}>
      <Page path={path} me={me} refreshMe={refreshMe} />
    </Layout>
  );
}
