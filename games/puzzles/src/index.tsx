import { createRoot } from 'react-dom/client';
import { defineGame } from '@ig/sdk';
import { PuzzlesGame } from './ui/PuzzlesGame';
import { setLocale } from './i18n';

export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const root = createRoot(container);
    root.render(<PuzzlesGame sdk={sdk} />);
    return { unmount: () => root.unmount() };
  },
});
