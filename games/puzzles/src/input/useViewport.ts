import { useEffect, useState } from 'react';
import type { Viewport } from '../game/boardFit';

const read = (): Viewport => ({ width: window.innerWidth, height: window.innerHeight });

/** Размер окна; обновляется при повороте экрана и изменении размера. */
export function useViewport(): Viewport {
  const [view, setView] = useState(read);
  useEffect(() => {
    const update = () => setView(read());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return view;
}
