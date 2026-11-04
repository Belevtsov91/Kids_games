import { defineGame } from '@ig/sdk';
import { EmotionHouse } from './app/EmotionHouse';
import { setLocale } from './i18n';
import './styles/index.css';

// «Домик эмоций»: узнать, что чувствует зверёк, и выбрать, что ему поможет. Плюс отметка «как я себя чувствую».
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new EmotionHouse(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
