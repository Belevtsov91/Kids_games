import { useEffect, useState } from 'react';

// Маленький маршрутизатор на History API: разделов немного, отдельная библиотека не нужна.

const listeners = new Set<() => void>();

export function navigate(path: string) {
  if (path !== location.pathname) history.pushState(null, '', path);
  listeners.forEach((fn) => fn());
  window.scrollTo(0, 0);
}

/** Текущий путь; компонент перерисовывается при переходе и при «назад». */
export function usePath() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const update = () => setPath(location.pathname);
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  return path;
}
