import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { defineGame } from '@ig/sdk';
import App from './app/App';
import { sound } from './audio/sound';

// Остров-конструктор: 3D-песочница на React Three Fiber + Rapier.
export default defineGame({
  mount(container, sdk) {
    sound.setMuted(sdk.audio.muted);
    const stopMuteSync = sdk.audio.onMuteChange((muted) => sound.setMuted(muted));
    const root = createRoot(container);
    const render = (paused: boolean) => root.render(createElement(App, { sdk, paused }));
    render(false);
    return {
      pause() {
        sound.pause();
        render(true);
      },
      resume() {
        sound.resume();
        render(false);
      },
      unmount() {
        stopMuteSync();
        root.unmount();
        sound.dispose();
      },
    };
  },
});
