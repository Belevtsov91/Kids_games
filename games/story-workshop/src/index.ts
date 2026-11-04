import { defineGame } from '@ig/sdk';
import { StoryWorkshop } from './app/StoryWorkshop';
import { setLocale } from './i18n';
import './styles/index.css';

// «Мастерская сказок»: выбрать героя и поворот сюжета и рассказать сказку по картинкам.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new StoryWorkshop(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
