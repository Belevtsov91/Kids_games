import { defineGame } from '@ig/sdk';
import { Traveller } from './app/Traveller';
import { setLocale } from './i18n';
import './styles/index.css';

// «Путешественник»: с мишкой Тёпой на воздушном шаре — флаги, столицы и глобус.
// Сначала дом (Молдова, Украина, Румыния), потом Европа и весь мир.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new Traveller(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
