import { useCallback, useState } from 'react';
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

  const openFromShelf = useCallback((id: BigId) => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    window.setTimeout(() => setFocused(id), reduce ? 0 : 450);
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
