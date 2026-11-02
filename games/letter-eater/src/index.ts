import { defineGame } from '@ig/sdk';
import { LetterEater } from './app/LetterEater';
import './styles/index.css';

export default defineGame({
  mount(container, sdk) {
    const game = new LetterEater(container, sdk);
    return {
      unmount: () => game.dispose(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
