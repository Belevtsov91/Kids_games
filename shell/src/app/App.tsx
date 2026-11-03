import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { I18nProvider, useI18n } from '@/i18n/I18nProvider';
import { WelcomePage } from '@/pages/WelcomePage';
import { AuthLayout, ForgotPage, LoginPage, RegisterPage, ResetPage } from '@/pages/AuthPages';
import { ChildrenPage } from '@/pages/ChildrenPage';
import { MenuPage } from '@/pages/MenuPage';
import { GamePage } from '@/pages/GamePage';
import { InfoPage } from '@/pages/InfoPage';
import { INFO_SLUGS } from '@/info/types';
import { KidStatusProvider } from '@/kid/KidStatus';
import { KidHomePage } from '@/kid/pages/KidHomePage';
import { KidTimePage } from '@/kid/pages/KidTimePage';
import { KidProgressPage } from '@/kid/pages/KidProgressPage';
import { ParentShell, parentRoutes } from '@/parent/routes';
import { KidStickersPage } from '@/more/pages/KidStickersPage';
import { AnswerPage } from '@/more/pages/AnswerPage';
import { HelperPage } from '@/more/pages/HelperPage';
import { LostPage, OfflineScreen } from '@/more/pages/LostPage';
import { SetupPage } from '@/more/pages/SetupPage';
import { GameCardPage, GamesPage } from '@/more/pages/GameCardPage';
import { NewsPage } from '@/more/pages/NewsPage';

/** Закрытые страницы: без входа — на /login; без профиля ребёнка — на /children. */
function Private({ children, needChild = false }: { children: ReactNode; needChild?: boolean }) {
  const { me, activeChild } = useAuth();
  const { t } = useI18n();
  if (me === undefined) return typeof navigator !== 'undefined' && !navigator.onLine ? <OfflineScreen /> : <div className="loading">{t.common.loading}</div>;
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
              {/* «Забыли пароль?» и страница из письма /reset#<токен> */}
              <Route path="/forgot" element={<ForgotPage />} />
              <Route path="/reset" element={<ResetPage />} />
            </Route>
            <Route path="/children" element={<Private><ChildrenPage /></Private>} />
            <Route path="/setup" element={<Private><SetupPage /></Private>} />
            {/* Страницы ребёнка: одно время на всех (таймер, тихие часы, закрытые взрослым игры). */}
            <Route element={<Private needChild><KidStatusProvider><Outlet /></KidStatusProvider></Private>}>
              <Route path="/dashboard" element={<MenuPage />} />
              <Route path="/play/:gameId" element={<GamePage />} />
              <Route path="/me" element={<KidHomePage />} />
              <Route path="/me/time" element={<KidTimePage />} />
              <Route path="/me/progress" element={<KidProgressPage />} />
              <Route path="/me/stickers" element={<KidStickersPage />} />
            </Route>
            {/* Кабинет родителя: закрыт задачей для взрослых и PIN. */}
            <Route path="/parent" element={<Private><ParentShell /></Private>}>
              {parentRoutes}
            </Route>
            {/* Документы и страницы «Родителям», «О проекте»: открыты всем, вход не нужен. */}
            {INFO_SLUGS.map((slug) => (
              <Route key={slug} path={`/${slug}`} element={<InfoPage slug={slug} />} />
            ))}
            {/* Без входа: ответ на просьбу из письма, страница помощника, карточки игр и новости. */}
            <Route path="/answer" element={<AnswerPage />} />
            <Route path="/helper" element={<HelperPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/:gameId" element={<GameCardPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="*" element={<LostPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
