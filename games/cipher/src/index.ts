import { defineGame } from '@ig/sdk';
import { CipherGame } from './app/CipherGame';
import { setLocale } from './i18n';
import './styles/index.css';

export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new CipherGame(container, sdk);
    return {
      unmount: () => game.dispose(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
