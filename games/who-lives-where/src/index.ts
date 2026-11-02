import { defineGame } from '@ig/sdk';
import { WhoLivesWhere } from './game';
import './styles.css';

// «Кто где живёт»: ребёнок отводит зверят домой — перетаскиванием или касанием «зверь → дом».
export default defineGame({
  mount(container, sdk) {
    const game = new WhoLivesWhere(container, sdk);
    return {
      unmount: () => game.dispose(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
