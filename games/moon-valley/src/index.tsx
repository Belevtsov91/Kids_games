import { createRoot } from 'react-dom/client';
import { defineGame } from '@ig/sdk';
import { MoonValley } from './app/MoonValley';
import { createPause } from './app/pause';

export default defineGame({
  mount(container, sdk) {
    const root = createRoot(container);
    const pause = createPause();
    root.render(<MoonValley sdk={sdk} pause={pause} />);
    return { unmount: () => root.unmount(), pause: () => pause.set(true), resume: () => pause.set(false) };
  },
});
