import { defineGame } from '@ig/sdk';
import { SeasonsGarden } from './app/SeasonsGarden';
import { setLocale } from './i18n';
import './styles/index.css';

// «Сад сезонов»: как меняются деревья, погода и звери по временам года.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new SeasonsGarden(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
