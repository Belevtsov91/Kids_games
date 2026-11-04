import { defineGame } from '@ig/sdk';
import { PackBackpack } from './app/PackBackpack';
import { setLocale } from './i18n';
import './styles/index.css';

// «Собери рюкзак»: что взять с собой в дождь, на пляж, в поход или к бабушке.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new PackBackpack(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
