import { useEffect } from 'react';

// В игре щипок и двойной тап не должны увеличивать страницу: ребёнок теряет поле.
// На остальных страницах масштаб разрешён (index.html), поэтому выключаем его только здесь.
const NO_ZOOM = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

export function useNoZoom() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;
    const prev = meta.content;
    meta.content = NO_ZOOM;
    return () => void (meta.content = prev);
  }, []);
}
