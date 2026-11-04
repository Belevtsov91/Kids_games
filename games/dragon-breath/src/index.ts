import { defineGame } from '@ig/sdk';
import { DragonBreath } from './app/DragonBreath';
import { setLocale } from './i18n';
import './styles/index.css';

// «Дыши с дракончиком»: спокойное дыхание по кругу-подсказке — вдох, пока держишь кнопку, и медленный выдох.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new DragonBreath(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
