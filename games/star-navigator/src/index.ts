import { defineGame } from '@ig/sdk';
import { StarNavigator } from './app/StarNavigator';
import { setLocale } from './i18n';
import './styles/index.css';

// «Звёздный штурман»: курс и мощность ракеты, притяжение планет, орбиты и гравитационные манёвры.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new StarNavigator(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
