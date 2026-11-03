import { defineGame } from '@ig/sdk';
import { RobotChef } from './app/RobotChef';
import { setLocale } from './i18n';
import './styles/index.css';

// «Робот-поварёнок»: ребёнок выкладывает стрелки-команды, робот собирает продукты и несёт их в кастрюлю.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new RobotChef(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
