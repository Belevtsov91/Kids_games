import { defineGame } from '@ig/sdk';
import { SafeRoad } from './app/SafeRoad';
import { setLocale } from './i18n';
import './styles/index.css';

// «Безопасная дорога»: Тёпа учится светофору, переходу по зебре и тому, что делать, если потерялся.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new SafeRoad(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
