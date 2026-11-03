import { createRoot } from 'react-dom/client';
import { defineGame } from '@ig/sdk';
import DrawingGame from './ui/DrawingGame';
import { sound } from './audio/sound';
import { setLocale } from './i18n';

export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    sound.setMuted(sdk.audio.muted);
    const stopMuteSync = sdk.audio.onMuteChange((muted) => sound.setMuted(muted));
    const root = createRoot(container);
    root.render(<DrawingGame sdk={sdk} />);
    return {
      unmount() {
        stopMuteSync();
        root.unmount();
        sound.dispose();
      },
    };
  },
});
