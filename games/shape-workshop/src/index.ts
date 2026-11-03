import { defineGame } from '@ig/sdk';
import { ShapeWorkshop } from './app/ShapeWorkshop';
import { setLocale } from './i18n';
import './styles/index.css';

// «Мастерская фигур»: картинки из геометрических фигур по силуэту и свободное строительство.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new ShapeWorkshop(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
