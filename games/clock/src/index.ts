import { defineGame } from '@ig/sdk';
import { ClockGame } from './app/ClockGame';
import { setLocale } from './i18n';
import './styles/index.css';

// «Который час»: часы на башне и день мишки Тёпы. Учимся узнавать время, 5–8 лет, без проигрышей.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new ClockGame(container, sdk);
    return {
      unmount: () => game.dispose(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
