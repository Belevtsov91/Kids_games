import { defineGame } from '@ig/sdk';
import { SpaceGardener } from './app/SpaceGardener';

// Космический садовник: 2D-головоломка с физикой. Рисуешь лианы — капли катятся к цветку.
export default defineGame({
  mount(container, sdk) {
    const game = new SpaceGardener(container, sdk);
    return {
      unmount: () => game.destroy(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
