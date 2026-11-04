import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { gameCount } from '@/i18n/plural';
import { games } from '@/catalog/catalog';
import { LanguageSwitch } from '@/i18n/LanguageSwitch';
import { ALL_IDS, isBig, showcaseGame, type BigId, type ShowcaseId } from '../showcase';
import type { WelcomeScene } from '../scene/WelcomeScene';
import { GamePanel } from './GamePanel';

interface Props {
  focused: ShowcaseId | null;
  onFocus: (id: ShowcaseId | null) => void;
  onThumbnails: (thumbs: Partial<Record<BigId, string>>) => void;
}

/** Первый экран: живой 3D-архипелаг, заголовок, выбор языка, подписи островов и карточка выбранной игры. */
export function WelcomeHero({ focused, onFocus, onThumbnails }: Props) {
  const { me } = useAuth();
  const { t, locale } = useI18n();
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
          onThumbnails: (th) => handlers.current.onThumbnails(th),
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
  const h = t.hero;

  return (
    <section className={cls} ref={heroRef}>
      <canvas ref={canvasRef} className="wl-canvas" aria-label={h.canvas} />
      <div className="wl-copy">
        <div className="wl-wrap">
          <div className="wl-copy-inner">
            <span className="wl-eyebrow">{gameCount(locale, games.length)} · {h.eyebrow}</span>
            <h1>
              {h.titleStart}<span className="wl-hl">{h.titleAccent}</span>{h.titleEnd}
            </h1>
            <p className="wl-lead">{h.lead}</p>
            <div className="wl-actions">
              <Link to={me ? '/dashboard' : '/register'} className="wl-btn wl-btn-primary">{me ? t.common.toGames : t.common.start}</Link>
              <a href="#worlds" className="wl-btn wl-btn-ghost">{h.seeGames}</a>
            </div>
            <LanguageSwitch className="wl-lang" />
            {!me && <p className="wl-note">{h.note}</p>}
          </div>
        </div>
      </div>

      <div className="wl-mobile-cta">
        <div className="wl-lang-row">
          <LanguageSwitch />
        </div>
        {me ? (
          <Link to="/dashboard" className="wl-btn wl-btn-primary">{t.common.toGames}</Link>
        ) : (
          <>
            <Link to="/register" className="wl-btn wl-btn-primary">{t.common.start}</Link>
            <Link to="/login" className="wl-btn wl-btn-ghost">{t.common.login}</Link>
          </>
        )}
      </div>

      <div className="wl-pills">
        {ALL_IDS.map((id) => {
          const g = showcaseGame(id, locale);
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
              aria-label={g.short ?? g.title}
            >
              <span className="wl-pill-icon" aria-hidden="true">{g.icon}</span>
              <span className="wl-pill-text">{g.short ?? g.title}</span>
            </button>
          );
        })}
      </div>

      <div className="wl-hint" aria-hidden="true">
        <span className="wl-hint-dot" />
        {h.hint}
      </div>

      <GamePanel game={focused ? showcaseGame(focused, locale) : null} onClose={() => onFocus(null)} />
    </section>
  );
}
