import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from '@/api/client';
import { useI18n } from '@/i18n/I18nProvider';
import { isLocale } from '@ig/sdk';

// Кто вошёл — знает только сервер. Здесь копия ответа /auth/me в памяти вкладки:
// ничего не пишется ни в localStorage, ни в sessionStorage, ни в IndexedDB.

export interface Child {
  id: string;
  name: string;
  age: number;
  avatar: string;
  /** Фото и язык игр задаёт взрослый в кабинете; null — эмодзи и язык сайта. */
  photo?: string | null;
  lang?: string | null;
  /** «Режим малыша»: null — по возрасту (до 5 лет включён), true/false — так решил взрослый. */
  toddler?: boolean | null;
  /** Громкость (0–100), меньше движения, крупные кнопки — из кабинета, раздел «Удобство». */
  comfort?: { musicVolume: number; effectsVolume: number; reduceMotion: boolean; bigButtons: boolean };
  /** Месяц рождения «YYYY-MM»; по нему сервер сам считает age. */
  birthMonth?: string | null;
  /** Сейчас месяц рождения: на главной торт и поздравление. */
  birthday?: boolean;
}

export interface Me {
  parent: { id: string; name: string; photo?: string | null };
  children: Child[];
  activeChildId: string | null;
}

interface AuthValue {
  /** undefined — ещё спрашиваем сервер, null — не вошёл. */
  me: Me | null | undefined;
  activeChild: Child | null;
  /** silent — не обновлять «кто вошёл» сразу: страница сначала доиграет анимацию, потом вызовет refresh(). */
  register(data: { name: string; email: string; password: string }, opts?: { silent?: boolean }): Promise<void>;
  login(data: { email: string; password: string }, opts?: { silent?: boolean }): Promise<void>;
  /** Заново спросить сервер, кто вошёл. */
  refresh(): Promise<void>;
  logout(): Promise<void>;
  addChild(data: Omit<Child, 'id'>): Promise<Child>;
  selectChild(childId: string): Promise<void>;
  /** Удалить аккаунт со всеми профилями и сохранениями. */
  deleteAccount(): Promise<void>;
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
  const { setLocale } = useI18n();

  const refresh = useCallback(async () => setMe(await fetchMe().catch(() => null)), []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthValue>(
    () => ({
      me,
      activeChild: me?.children.find((c) => c.id === me.activeChildId) ?? null,
      async register(data, opts) {
        await api.post('/auth/register', data);
        if (!opts?.silent) await refresh();
      },
      async login(data, opts) {
        await api.post('/auth/login', data);
        if (!opts?.silent) await refresh();
      },
      refresh,
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
        // язык игр, который выбрал взрослый для этого ребёнка
        const lang = me?.children.find((c) => c.id === childId)?.lang;
        if (isLocale(lang)) setLocale(lang);
        setMe((prev) => (prev ? { ...prev, activeChildId: childId } : prev));
      },
      async deleteAccount() {
        await api.delete('/auth/account');
        setMe(null);
      },
    }),
    [me, refresh, setLocale],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth вне AuthProvider');
  return value;
}
