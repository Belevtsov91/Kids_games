import { defineGame } from '@ig/sdk';
import { WhoLivesWhere } from './app/WhoLivesWhere';
import './styles/index.css';
import { setLocale } from './i18n';

// «Кто где живёт»: ребёнок отводит зверят домой — перетаскиванием или касанием «зверь → дом».
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new WhoLivesWhere(container, sdk);
    return {
      unmount: () => game.dispose(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
