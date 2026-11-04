import { defineGame } from '@ig/sdk';
import { MemoryTrain } from './app/MemoryTrain';
import { setLocale } from './i18n';
import './styles/index.css';

// «Паровозик памяти»: запомнить пассажиров, пока поезд не уехал в туннель.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const game = new MemoryTrain(container, sdk);
    return { unmount: () => game.dispose(), pause: () => game.pause(), resume: () => game.resume() };
  },
});
