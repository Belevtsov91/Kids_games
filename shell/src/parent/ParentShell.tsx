import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import { DashSky } from '@/dashboard/DashSky';
import { useAuth } from '@/auth/AuthContext';
import { LanguageSwitch } from '@/i18n/LanguageSwitch';
import { onParentEvent, papi } from './api';
import { ParentGate } from './gate/ParentGate';
import { HandOver } from './HandOver';
import { ParentNav } from './ParentNav';
import { useParentText } from './text';

const OPEN_MS = 15 * 60 * 1000;

interface ParentCtx {
  toast(message: string): void;
  lock(): Promise<void>;
}
const Ctx = createContext<ParentCtx | null>(null);
export const useParent = () => {
  const value = useContext(Ctx);
  if (!value) throw new Error('useParent вне ParentShell');
  return value;
};

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** Кабинет родителя (/parent/*): закрыт задачей и PIN; открытый — с таймером автозакрытия и меню разделов. */
export function ParentShell() {
  const p = useParentText();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<{ open: boolean; hasPin: boolean } | null>(null);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [handOver, setHandOver] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await papi.raw.get<{ unlocked: boolean; until: string | null; hasPin: boolean }>('/status');
      setState({ open: s.unlocked, hasPin: s.hasPin });
      if (s.until) setUntil(new Date(s.until).getTime());
    } catch {
      setState({ open: false, hasPin: false });
    }
  }, []);

  useEffect(() => void load(), [load]);
  useEffect(
    () =>
      onParentEvent((e) => {
        if (e === 'activity') setUntil(Date.now() + OPEN_MS);
        else setState((s) => s && { ...s, open: false });
      }),
    [],
  );
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (state?.open && until && now >= until) setState({ ...state, open: false });
  }, [now, until, state]);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 2800);
    return () => clearTimeout(id);
  }, [message]);

  const lock = useCallback(async () => {
    await papi.raw.post('/lock', {}).catch(() => undefined);
    setState((s) => s && { ...s, open: false });
  }, []);

  const ctx: ParentCtx = { toast: setMessage, lock };

  return (
    <Ctx.Provider value={ctx}>
      <div className={`dash pa${state?.open ? ' pa-open' : ' pa-locked'}`}>
        <DashSky />
        <header className="dash-top dash-wrap pa-top">
          <Link to={state?.open ? '/parent' : '/dashboard'} className="dash-logo">
            <span className="dash-logo-mark" aria-hidden="true">🐻</span>
            <span className="pa-logo-text">
              <small>{p.gate.eyebrow}</small>
              <span className="dash-logo-name">Interact Games</span>
            </span>
          </Link>
          <LanguageSwitch className="dash-lang" />
          {state?.open && (
            <>
              <span className="pa-mode" title={p.bar.mode}>
                <span className="pa-mode-label">{p.bar.mode}</span>
                <b>{clock(until - now)}</b>
                <button type="button" onClick={() => void lock()}>{p.bar.lock}</button>
              </span>
              <button type="button" className="dash-chip" onClick={() => setHandOver(true)}>
                🎮 <span className="pa-hide-sm">{p.bar.handOver}</span>
              </button>
            </>
          )}
        </header>

        {!state ? null : state.open ? (
          <div className="pa-layout dash-wrap">
            <ParentNav />
            <main className="pa-main">
              <Outlet />
            </main>
          </div>
        ) : (
          <main className="dash-wrap">
            <ParentGate
              hasPin={state.hasPin}
              onUnlocked={() => {
                setUntil(Date.now() + OPEN_MS);
                setState({ ...state, open: true });
                void refresh();
              }}
            />
          </main>
        )}

        {handOver && (
          <HandOver
            onClose={() => setHandOver(false)}
            onDone={async () => {
              await lock();
              navigate('/dashboard');
            }}
          />
        )}
        <div className={`pa-toast${message ? ' show' : ''}`} role="status" aria-live="polite">{message}</div>
      </div>
    </Ctx.Provider>
  );
}
