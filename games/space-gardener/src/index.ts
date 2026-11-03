import { defineGame } from '@ig/sdk';
import { SpaceGardener } from './app/SpaceGardener';
import { setLocale } from './i18n';

// Космический садовник: 2D-головоломка с физикой. Рисуешь лианы — капли катятся к цветку.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new SpaceGardener(container, sdk);
    return {
      unmount: () => game.destroy(),
      pause: () => game.pause(),
      resume: () => game.resume(),
    };
  },
});
