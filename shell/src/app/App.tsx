import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
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
import { WakeGate } from '@/wake/WakeGate';

/** Закрытые страницы: без входа — на /login; без профиля ребёнка или после долгого перерыва — на /children. */
function Private({ children, needChild = false }: { children: ReactNode; needChild?: boolean }) {
  const { me, offline, activeChild } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  if (offline && !me) return <OfflineScreen />;
  if (me === undefined) return typeof navigator !== 'undefined' && !navigator.onLine ? <OfflineScreen /> : <Loading label={t.common.loading} />;
  // После входа вернём туда, куда шли (глубокая ссылка на игру, кабинет и т. п.).
  if (!me) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (needChild && (!activeChild || me.askWho)) return <Navigate to="/children" replace />;
  return children;
}

/** Вход и регистрация: тем, кто уже вошёл, они не нужны. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const { t } = useI18n();
  const from = (useLocation().state as { from?: unknown } | null)?.from;
  if (me === undefined) return <Loading label={t.common.loading} />;
  if (me) return <Navigate to={safeReturn(from)} replace />;
  return children;
}

/** Куда вернуть после входа: только внутренний путь этого сайта, иначе дашборд. */
function safeReturn(from: unknown): string {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !/^\/(login|register|forgot|reset)/.test(from) ? from : '/dashboard';
}

/** Пока спрашиваем сервер: мягкий пульсирующий мишка вместо голого текста. */
function Loading({ label }: { label: string }) {
  return (
    <div className="loading" role="status">
      <span className="loading-mark" aria-hidden="true" />
      <span className="loading-text">{label}</span>
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <WakeGate>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              {/* Одна 3D-сцена на обе страницы: вкладки переключают форму, а остров остаётся. */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
                <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
                {/* «Забыли пароль?» и страница из письма /reset#<токен>. /reset открыт и вошедшему: иначе ссылка из письма теряется. */}
                <Route path="/forgot" element={<GuestOnly><ForgotPage /></GuestOnly>} />
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
      </WakeGate>
    </I18nProvider>
  );
}
