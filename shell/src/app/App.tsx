import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { I18nProvider, useI18n } from '@/i18n/I18nProvider';
import { WelcomePage } from '@/pages/WelcomePage';
import { AuthLayout, LoginPage, RegisterPage } from '@/pages/AuthPages';
import { ChildrenPage } from '@/pages/ChildrenPage';
import { MenuPage } from '@/pages/MenuPage';
import { GamePage } from '@/pages/GamePage';
import { InfoPage } from '@/pages/InfoPage';
import { INFO_SLUGS } from '@/info/types';

/** Закрытые страницы: без входа — на /login; без профиля ребёнка — на /children. */
function Private({ children, needChild = false }: { children: ReactNode; needChild?: boolean }) {
  const { me, activeChild } = useAuth();
  const { t } = useI18n();
  if (me === undefined) return <div className="loading">{t.common.loading}</div>;
  if (!me) return <Navigate to="/login" replace />;
  if (needChild && !activeChild) return <Navigate to="/children" replace />;
  return children;
}

/** Вход и регистрация: тем, кто уже вошёл, они не нужны. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const { t } = useI18n();
  if (me === undefined) return <div className="loading">{t.common.loading}</div>;
  if (me) return <Navigate to="/dashboard" replace />;
  return children;
}

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            {/* Одна 3D-сцена на обе страницы: вкладки переключают форму, а остров остаётся. */}
            <Route element={<GuestOnly><AuthLayout /></GuestOnly>}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route path="/children" element={<Private><ChildrenPage /></Private>} />
            <Route path="/dashboard" element={<Private needChild><MenuPage /></Private>} />
            <Route path="/play/:gameId" element={<Private needChild><GamePage /></Private>} />
            {/* Документы и страницы «Родителям», «О проекте»: открыты всем, вход не нужен. */}
            {INFO_SLUGS.map((slug) => (
              <Route key={slug} path={`/${slug}`} element={<InfoPage slug={slug} />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
