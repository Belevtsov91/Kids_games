import { createRoot } from 'react-dom/client';
import { defineGame } from '@ig/sdk';
import { App } from './ui/App';

export default defineGame({
  mount(container, sdk) {
    const root = createRoot(container);
    // Пауза от оболочки (вкладка скрыта): останавливаем отрисовку и физику.
    let paused = false;
    const listeners = new Set<() => void>();
    const pause = {
      subscribe: (listener: () => void) => (listeners.add(listener), () => void listeners.delete(listener)),
      get: () => paused,
    };
    const set = (value: boolean) => ((paused = value), listeners.forEach((listener) => listener()));
    root.render(<App sdk={sdk} pause={pause} />);
    return { unmount: () => root.unmount(), pause: () => set(true), resume: () => set(false) };
  },
});
