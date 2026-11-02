import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from '@/api/client';

// Кто вошёл — знает только сервер. Здесь копия ответа /auth/me в памяти вкладки:
// ничего не пишется ни в localStorage, ни в sessionStorage, ни в IndexedDB.

export interface Child {
  id: string;
  name: string;
  age: number;
  avatar: string;
}

export interface Me {
  parent: { id: string; name: string };
  children: Child[];
  activeChildId: string | null;
}

interface AuthValue {
  /** undefined — ещё спрашиваем сервер, null — не вошёл. */
  me: Me | null | undefined;
  activeChild: Child | null;
  register(data: { name: string; email: string; password: string }): Promise<void>;
  login(data: { email: string; password: string }): Promise<void>;
  logout(): Promise<void>;
  addChild(data: Omit<Child, 'id'>): Promise<Child>;
  selectChild(childId: string): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

async function fetchMe(): Promise<Me | null> {
  try {
    return await api.get<Me>('/auth/me');
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 503)) return null;
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  const refresh = useCallback(async () => setMe(await fetchMe().catch(() => null)), []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthValue>(
    () => ({
      me,
      activeChild: me?.children.find((c) => c.id === me.activeChildId) ?? null,
      async register(data) {
        await api.post('/auth/register', data);
        await refresh();
      },
      async login(data) {
        await api.post('/auth/login', data);
        await refresh();
      },
      async logout() {
        await api.post('/auth/logout', undefined).catch(() => undefined);
        setMe(null);
      },
      async addChild(data) {
        const child = await api.post<Child>('/children', data);
        await api.put('/children/active', { childId: child.id });
        await refresh();
        return child;
      },
      async selectChild(childId) {
        await api.put('/children/active', { childId });
        setMe((prev) => (prev ? { ...prev, activeChildId: childId } : prev));
      },
    }),
    [me, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth вне AuthProvider');
  return value;
}
