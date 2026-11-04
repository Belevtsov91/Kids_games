import { defineGame } from '@ig/sdk';
import { LittleShop } from './app/LittleShop';
import { setLocale } from './i18n';
import './styles/index.css';

// «Магазинчик»: весы и гирьки, сок до отметки, касса со сдачей — математика из жизни.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new LittleShop(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
