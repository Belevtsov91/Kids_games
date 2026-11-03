import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { ALL_IDS, SHOWCASE, isBig, type BigId, type ShowcaseId } from '../showcase';
import type { WelcomeScene } from '../scene/WelcomeScene';
import { GamePanel } from './GamePanel';

interface Props {
  focused: ShowcaseId | null;
  onFocus: (id: ShowcaseId | null) => void;
  onThumbnails: (thumbs: Partial<Record<BigId, string>>) => void;
}

/** Первый экран: живой 3D-архипелаг, заголовок, подписи островов и карточка выбранной игры. */
export function WelcomeHero({ focused, onFocus, onThumbnails }: Props) {
  const { me } = useAuth();
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<WelcomeScene | null>(null);
  const labels = useRef<Partial<Record<ShowcaseId, HTMLButtonElement | null>>>({});
  const [hovered, setHovered] = useState<ShowcaseId | null>(null);
  const [no3d, setNo3d] = useState(false);
  // колбэки сцены читают свежие пропсы через ref, чтобы не пересоздавать сцену
  const handlers = useRef({ onFocus, onThumbnails });
  handlers.current = { onFocus, onThumbnails };

  useEffect(() => {
    let alive = true;
    let scene: WelcomeScene | null = null;
    // three.js грузится отдельным чанком, чтобы не тормозить остальные страницы
    import('../scene/WelcomeScene')
      .then(({ WelcomeScene }) => {
        if (!alive || !canvasRef.current || !heroRef.current) return;
        scene = new WelcomeScene(canvasRef.current, heroRef.current, {
          onPick: (id) => handlers.current.onFocus(id),
          onHover: setHovered,
          labels: () => labels.current,
          onThumbnails: (t) => handlers.current.onThumbnails(t),
        });
        sceneRef.current = scene;
      })
      .catch((err: unknown) => {
        console.warn('3D-сцена недоступна', err);
        if (alive) setNo3d(true);
      });
    return () => {
      alive = false;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setFocus(focused);
  }, [focused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handlers.current.onFocus(null);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const cls = ['wl-hero', focused && 'is-focused', no3d && 'is-flat'].filter(Boolean).join(' ');

  return (
    <section className={cls} ref={heroRef}>
      <canvas ref={canvasRef} className="wl-canvas" aria-label="Летающие острова: каждый остров — игра" />
      <div className="wl-copy">
        <div className="wl-wrap">
          <div className="wl-copy-inner">
            <span className="wl-eyebrow">10 игр · от 3 до 15 лет</span>
            <h1>
              Привет! Выбирай <span className="wl-hl">свой мир</span> и играй!
            </h1>
            <p className="wl-lead">
              Спасай Лунную Долину, строй остров из блоков, выращивай цветы в космосе. Каждый остров здесь — отдельная игра.
            </p>
            <div className="wl-actions">
              <Link to={me ? '/dashboard' : '/register'} className="wl-btn wl-btn-primary">{me ? 'К играм' : 'Начать играть'}</Link>
              <a href="#worlds" className="wl-btn wl-btn-ghost">Посмотреть игры</a>
            </div>
            {!me && <p className="wl-note">Аккаунт заводит взрослый, а дети выбирают свой профиль.</p>}
          </div>
        </div>
      </div>

      <div className="wl-mobile-cta">
        {me ? (
          <Link to="/dashboard" className="wl-btn wl-btn-primary">К играм</Link>
        ) : (
          <>
            <Link to="/register" className="wl-btn wl-btn-primary">Начать играть</Link>
            <Link to="/login" className="wl-btn wl-btn-ghost">Войти</Link>
          </>
        )}
      </div>

      <div className="wl-pills">
        {ALL_IDS.map((id) => {
          const g = SHOWCASE[id];
          const cn = ['wl-pill', !isBig(id) && 'is-small', hovered === id && 'is-hot'].filter(Boolean).join(' ');
          return (
            <button
              key={id}
              type="button"
              ref={(el) => {
                labels.current[id] = el;
              }}
              className={cn}
              style={{ '--c': g.color } as CSSProperties}
              onClick={() => onFocus(id)}
              tabIndex={isBig(id) ? 0 : -1}
            >
              <span className="wl-pill-icon" aria-hidden="true">{g.icon}</span>
              {g.short ?? g.title}
            </button>
          );
        })}
      </div>

      <div className="wl-hint" aria-hidden="true">
        <span className="wl-hint-dot" />
        Нажми на любой остров
      </div>

      <GamePanel game={focused ? SHOWCASE[focused] : null} onClose={() => onFocus(null)} />
    </section>
  );
}
