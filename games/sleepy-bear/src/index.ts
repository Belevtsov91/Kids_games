import { defineGame } from '@ig/sdk';
import { SleepyBear } from './app/SleepyBear';
import { setLocale } from './i18n';
import './styles/index.css';

// «Тёпа идёт спать»: спокойный вечерний ритуал для 3–4 лет. Всё голосом, без проигрышей.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new SleepyBear(container, sdk);
    return {
      unmount: () => game.dispose(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
