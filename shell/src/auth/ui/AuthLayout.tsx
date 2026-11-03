import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { LanguageSwitch } from '@/i18n/LanguageSwitch';
import { useI18n } from '@/i18n/I18nProvider';
import type { AuthScene } from '../scene/AuthScene';
import { initialFx, type AuthMode, type FxState } from '../scene/state';
import { useAuthText } from '../text';
import { AuthFxContext, type AuthFx } from './fxContext';

// Общая рамка /login и /register: 3D-остров на весь экран, карточка с вкладками и формой.
// Сцена одна на обе страницы: при переключении вкладки мишка просто переходит на другое место.

const replay = (el: HTMLElement | null, cls: string) => {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
};

export function AuthLayout() {
  const { t } = useI18n();
  const text = useAuthText();
  const mode: AuthMode = useLocation().pathname.startsWith('/register') ? 'register' : 'login';
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AuthScene | null>(null);
  const fxRef = useRef<FxState>(initialFx(mode));
  const [noWebgl, setNoWebgl] = useState(false);

  const fx = useMemo<AuthFx>(() => {
    let hideAt = 0;
    return {
      set(patch) {
        fxRef.current = { ...fxRef.current, ...patch };
        sceneRef.current?.set(fxRef.current);
      },
      wrong() {
        sceneRef.current?.wrong();
        replay(cardRef.current, 'is-shaking');
        navigator.vibrate?.([60, 40, 60]);
      },
      win() {
        sceneRef.current?.win();
        cardRef.current?.classList.add('is-won');
      },
      letter: (ch) => sceneRef.current?.letter(ch),
      setName: (name) => sceneRef.current?.setName(name),
      say(line, ms = 2600) {
        const el = bubbleRef.current;
        if (!el) return;
        el.textContent = line;
        replay(el, 'is-on');
        clearTimeout(hideAt);
        hideAt = window.setTimeout(() => el.classList.remove('is-on'), ms);
      },
    };
  }, []);

  // сцену создаём один раз; если WebGL недоступен, страница работает и без неё
  useEffect(() => {
    if (!canvasRef.current || !hostRef.current) return;
    let scene: AuthScene | null = null;
    let alive = true;
    void import('../scene/AuthScene').then(({ AuthScene }) => {
      if (!alive || !canvasRef.current || !hostRef.current) return;
      try {
        scene = new AuthScene(canvasRef.current, hostRef.current, fxRef.current.mode, () => bubbleRef.current);
        scene.set(fxRef.current);
        sceneRef.current = scene;
      } catch {
        setNoWebgl(true);
      }
    });
    return () => {
      alive = false;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const first = useRef(true);
  useEffect(() => {
    fx.set({ mode, focus: null, peek: false });
    if (!first.current) replay(cardRef.current, 'is-flipping');
    const hello = setTimeout(() => fx.say(mode === 'login' ? text.say.helloLogin : text.say.helloRegister, 3400), first.current ? 1900 : 300);
    first.current = false;
    return () => clearTimeout(hello);
  }, [mode, fx, text]);

  return (
    <AuthFxContext.Provider value={fx}>
      <div className={`au${noWebgl ? ' au-flat' : ''}`}>
        <div className="au-stage" ref={hostRef}>
          <canvas ref={canvasRef} className="au-canvas" role="img" aria-label={text.scene} />
          <div className="au-veil" />
        </div>
        <div className="au-bubble" ref={bubbleRef} aria-hidden="true" />
        <header className="au-top">
          <Link to="/" className="au-logo" aria-label="Interact Games">
            <span className="au-logo-mark" aria-hidden="true">🐻</span>
            <span className="au-logo-text">Interact Games</span>
          </Link>
          <div className="au-top-right">
            <LanguageSwitch />
            <Link to="/" className="au-ghost">← {t.common.home}</Link>
          </div>
        </header>
        <main className="au-layout">
          <div className="au-card-wrap">
            <div className="au-card" ref={cardRef} onAnimationEnd={(e) => e.currentTarget.classList.remove('is-shaking', 'is-flipping')}>
              <nav className="au-tabs" data-mode={mode} aria-label={t.common.login}>
                <span className="au-tabs-pill" aria-hidden="true" />
                <NavLink to="/login" replace>{t.common.login}</NavLink>
                <NavLink to="/register" replace>{t.common.register}</NavLink>
              </nav>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </AuthFxContext.Provider>
  );
}
