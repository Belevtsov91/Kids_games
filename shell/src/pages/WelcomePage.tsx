import { useCallback, useEffect, useRef, useState } from 'react';
import type { BigId, ShowcaseId } from '@/welcome/showcase';
import { WelcomeHero } from '@/welcome/components/WelcomeHero';
import { WorldShelf } from '@/welcome/components/WorldShelf';
import { MoreGames } from '@/welcome/components/MoreGames';
import { ParentsNote } from '@/welcome/components/ParentsNote';
import { SiteFooter } from '@/info/components/SiteFooter';
import { SiteTopbar } from '@/info/components/SiteTopbar';

/** Стартовая страница для гостей: 3D-архипелаг игр, полка ярких миров и блок для родителей. */
export function WelcomePage() {
  const [focused, setFocused] = useState<ShowcaseId | null>(null);
  const [thumbs, setThumbs] = useState<Partial<Record<BigId, string>>>({});

  const pending = useRef<() => void>(() => undefined);
  useEffect(() => () => pending.current(), []);

  // Подлёт к острову начинается, когда страница докрутилась наверх (scrollend), с запасным таймером.
  const openFromShelf = useCallback((id: BigId) => {
    pending.current();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || window.scrollY < 4) return setFocused(id);
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      cleanup();
      setFocused(id);
    };
    const timer = window.setTimeout(go, 900);
    const cleanup = () => {
      clearTimeout(timer);
      removeEventListener('scrollend', go);
    };
    pending.current = () => {
      done = true;
      cleanup();
    };
    addEventListener('scrollend', go, { once: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <main className="wl">
      <SiteTopbar />
      <WelcomeHero focused={focused} onFocus={setFocused} onThumbnails={setThumbs} />
      <WorldShelf thumbs={thumbs} onOpen={openFromShelf} />
      <MoreGames />
      <ParentsNote />
      <SiteFooter />
    </main>
  );
}
