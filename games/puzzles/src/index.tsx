import { createRoot } from 'react-dom/client';
import { defineGame } from '@ig/sdk';
import { PuzzlesGame } from './ui/PuzzlesGame';

export default defineGame({
  mount(container, sdk) {
    const root = createRoot(container);
    root.render(<PuzzlesGame sdk={sdk} />);
    return { unmount: () => root.unmount() };
  },
});
