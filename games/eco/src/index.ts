import { defineGame } from '@ig/sdk';
import { EcoCity } from './app/EcoCity';
import { setLocale } from './i18n';
import './styles/index.css';

// «Эко-город» для 10–15 лет: панели, ветряки и батареи, чтобы свет горел и днём, и ночью.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new EcoCity(container, sdk);
    return {
      unmount: () => game.dispose(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
