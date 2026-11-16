import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ageOf, type GameSdk } from '@ig/sdk';
import { createSound } from '../audio/sound';
import { LEVELS } from '../game/levels';
import { parseBest, recordBest, startLevelForAge, type Best } from '../game/score';
import { textsFor } from '../i18n';
import { LevelMap } from './LevelMap';
import { Play } from './Play';
import { reportRun } from './rewards';
import { useRapier } from './useRapier';
import '../styles/lab.css';
import '../styles/play.css';
import '../styles/card.css';

export interface PauseStore {
  subscribe(listener: () => void): () => void;
  get(): boolean;
}

const SAVE_KEY = 'best';

export function App({ sdk, pause }: { sdk: GameSdk; pause: PauseStore }) {
  const paused = useSyncExternalStore(pause.subscribe, pause.get, pause.get);
  const t = textsFor(sdk.locale);
  const rapier = useRapier();
  const sound = useMemo(() => createSound(() => sdk.audio.muted), [sdk]);
  const [best, setBest] = useState<Best>(() => parseBest(sdk.storage.load(SAVE_KEY)));
  const [index, setIndex] = useState<number | null>(null);
  const start = startLevelForAge(ageOf(sdk.profile));
  useEffect(() => () => sound.dispose(), [sound]);

  const finish = (levelIndex: number, stars: number) => {
    const next = recordBest(best, LEVELS[levelIndex].id, stars);
    if (next !== best) {
      setBest(next);
      sdk.storage.save(SAVE_KEY, next);
    }
    reportRun(sdk, levelIndex, stars, next);
  };

  const rootClass = `lab-root${sdk.comfort.bigButtons ? ' is-big' : ''}`;
  if (!rapier) return <div className={rootClass}><p className="lab-loading">{t.loading}</p></div>;
  return (
    <div className={rootClass}>
      {index === null ? (
        <LevelMap t={t} best={best} start={start} onPick={setIndex} />
      ) : (
        <Play
          key={index}
          t={t}
          rapier={rapier}
          level={LEVELS[index]}
          index={index}
          paused={paused}
          still={sdk.comfort.reduceMotion}
          sound={sound}
          hasNext={index + 1 < LEVELS.length}
          onFinish={(stars) => finish(index, stars)}
          onMap={() => setIndex(null)}
          onNext={() => setIndex(index + 1 < LEVELS.length ? index + 1 : null)}
        />
      )}
    </div>
  );
}
