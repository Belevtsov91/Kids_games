import { createRoot } from 'react-dom/client';
import { defineGame } from '@ig/sdk';
import Playground3D from './Playground3D';

export default defineGame({
  mount(container) {
    const root = createRoot(container);
    root.render(<Playground3D />);
    return { unmount: () => root.unmount() };
  },
});
