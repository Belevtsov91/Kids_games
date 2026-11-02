import { createRoot } from 'react-dom/client';
import { defineGame } from '@ig/sdk';
import { MoonValley } from './app/MoonValley';

export default defineGame({
  mount(container, sdk) {
    const root = createRoot(container);
    root.render(<MoonValley sdk={sdk} />);
    return { unmount: () => root.unmount(), pause: () => undefined, resume: () => undefined };
  },
});
