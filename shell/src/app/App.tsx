import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { WelcomePage } from '@/pages/WelcomePage';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import { ChildrenPage } from '@/pages/ChildrenPage';
import { MenuPage } from '@/pages/MenuPage';
import { GamePage } from '@/pages/GamePage';
import { InfoPage } from '@/pages/InfoPage';
import { INFO_SLUGS } from '@/info/types';

/** Закрытые страницы: без входа — на /login; без профиля ребёнка — на /children. */
function Private({ children, needChild = false }: { children: ReactNode; needChild?: boolean }) {
  const { me, activeChild } = useAuth();
  if (me === undefined) return <div className="loading">Загрузка…</div>;
  if (!me) return <Navigate to="/login" replace />;
  if (needChild && !activeChild) return <Navigate to="/children" replace />;
  return children;
}

/** Вход и регистрация: тем, кто уже вошёл, они не нужны. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  if (me === undefined) return <div className="loading">Загрузка…</div>;
  if (me) return <Navigate to="/dashboard" replace />;
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
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
  );
}
