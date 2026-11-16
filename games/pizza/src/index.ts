import { defineGame } from '@ig/sdk';
import { Pizzeria } from './app/Pizzeria';
import { setLocale } from './i18n';
import './styles/index.css';

// «Пиццерия дробей»: медвежонок Тёпа печёт пиццу, ребёнок режет её на равные части и раскладывает начинку долями из заказа.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new Pizzeria(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
