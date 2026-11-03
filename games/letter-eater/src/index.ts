import { defineGame } from '@ig/sdk';
import { LetterEater } from './app/LetterEater';
import './styles/index.css';
import { setLocale } from './i18n';

export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new LetterEater(container, sdk);
    return {
      unmount: () => game.dispose(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
