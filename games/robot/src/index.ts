import { defineGame } from '@ig/sdk';
import { RobotCourier } from './app/RobotCourier';
import { setLocale } from './i18n';
import './styles/index.css';

// «Робот-курьер»: ребёнок программирует робота командами «вперёд / налево / направо»,
// потом блоками «повтори» и «если», чтобы развезти посылки Тёпе и друзьям по острову.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new RobotCourier(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
