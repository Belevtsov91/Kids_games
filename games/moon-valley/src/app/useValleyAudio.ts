// Звук игры: слушаем общий выключатель оболочки, музыка играет только в мире и пока вкладка видна.
// Возвращает sound(effect, volume) для коротких эффектов.

import { useCallback, useEffect, useState } from 'react';
import type { GameSdk } from '@ig/sdk';
import { valleySound, type Effect } from '../audio/sound';

export function useValleyAudio(sdk: GameSdk, started: boolean, paused: boolean) {
  const sound = useCallback((effect: Effect, volume?: number) => valleySound.play(effect, volume), []);
  const [muted, setMuted] = useState(sdk.audio.muted);
  useEffect(() => {
    valleySound.setMuted(sdk.audio.muted);
    const stop = sdk.audio.onMuteChange((value) => {
      valleySound.setMuted(value);
      setMuted(value);
    });
    return () => {
      stop();
      valleySound.dispose();
    };
  }, [sdk]);
  useEffect(() => {
    if (started && !paused && !muted) valleySound.start();
    else valleySound.stop();
  }, [started, paused, muted]);
  return sound;
}
