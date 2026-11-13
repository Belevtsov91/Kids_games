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
  /** План дня от взрослого: до трёх id игр, они наверху дашборда с галочками. */
  plan?: string[];
}

export interface Me {
  parent: { id: string; name: string; photo?: string | null };
  children: Child[];
  activeChildId: string | null;
}

interface AuthValue {
  /** undefined — ещё спрашиваем сервер, null — не вошёл. */
  me: Me | null | undefined;
  /** Последний вопрос «кто вошёл» не дошёл до сервера из-за сети: показываем «нет сети», а не вход. */
  offline: boolean;
  activeChild: Child | null;
  /** silent — не обновлять «кто вошёл» сразу: страница сначала доиграет анимацию, потом вызовет refresh(). */
  register(data: { name: string; email: string; password: string }, opts?: { silent?: boolean }): Promise<void>;
  login(data: { email: string; password: string }, opts?: { silent?: boolean }): Promise<void>;
  /** Заново спросить сервер, кто вошёл. true — ответ получен (вошёл или нет), false — спросить не удалось. */
  refresh(): Promise<boolean>;
  logout(): Promise<void>;
  addChild(data: Omit<Child, 'id'>): Promise<Child>;
  selectChild(childId: string): Promise<void>;
  /** Удалить аккаунт со всеми профилями и сохранениями. */
  deleteAccount(password: string): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

async function fetchMe(): Promise<Me | null> {
  try {
    return await api.get<Me>('/auth/me');
  } catch (err) {
    // Только 401 значит «не вошёл». 503 и прочие ошибки ничего не говорят о сессии: вошедшего не выкидываем.
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [offline, setOffline] = useState(false);
  const { setLocale } = useI18n();

  // 401/503 — точно не вошёл (fetchMe вернёт null). Любая другая ошибка (500, сеть после повтора) ничего не говорит
  // о сессии: того, кто уже вошёл, не выкидываем, а при первой загрузке показываем гостевой вид.
  const refresh = useCallback(async () => {
    try {
      setMe(await fetchMe());
      setOffline(false);
      return true;
    } catch (err) {
      setOffline(!(err instanceof ApiError) && typeof navigator !== 'undefined' && !navigator.onLine);
      setMe((prev) => prev ?? null);
      return false;
    }
  }, []);

  // Сеть вернулась: снова спрашиваем, кто вошёл.
  useEffect(() => {
    const back = () => void refresh();
    addEventListener('online', back);
    return () => removeEventListener('online', back);
  }, [refresh]);

  /**
   * POST входа или регистрации не повторяется сам (он мог уже пройти). Если ответа не было —
   * спрашиваем /auth/me: вдруг сервер всё сделал, а ответ потерялся по дороге.
   */
  const sendAuth = useCallback(async (path: string, body: unknown) => {
    try {
      await api.post(path, body);
    } catch (err) {
      const lost = !(err instanceof ApiError) || err.status >= 502;
      if (lost && (await fetchMe().catch(() => null))) return;
      throw err;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthValue>(
    () => ({
      me,
      offline,
      activeChild: me?.children.find((c) => c.id === me.activeChildId) ?? null,
      async register(data, opts) {
        await sendAuth('/auth/register', { ...data, tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
        if (!opts?.silent) await refresh();
      },
      async login(data, opts) {
        await sendAuth('/auth/login', data);
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
      async deleteAccount(password) {
        await api.delete('/auth/account', { password });
        setMe(null);
      },
    }),
    [me, offline, refresh, sendAuth, setLocale],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth вне AuthProvider');
  return value;
}
