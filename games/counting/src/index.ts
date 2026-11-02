import { defineGame } from '@ig/sdk';
import { CountingGame } from './app/CountingGame';
import './styles/index.css';
export default defineGame({
  mount(container, sdk) {
    const game = new CountingGame(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
