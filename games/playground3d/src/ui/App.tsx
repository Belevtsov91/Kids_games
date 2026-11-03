import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { GameSdk } from '@ig/sdk';
import { addToy, makeToy, TOY_KINDS, type Toy, type ToyKind } from '../game/toys';
import { createSound } from '../audio/sound';
import { textsFor } from '../i18n';
import { Sandbox } from '../scene/Sandbox';
import '../styles/sandbox.css';

export interface PauseStore {
  subscribe(listener: () => void): () => void;
  get(): boolean;
}

export function App({ sdk, pause }: { sdk: GameSdk; pause: PauseStore }) {
  const paused = useSyncExternalStore(pause.subscribe, pause.get, pause.get);
  const t = textsFor(sdk.locale);
  const sound = useMemo(() => createSound(() => sdk.audio.muted), [sdk]);
  const [kind, setKind] = useState<ToyKind>('ball');
  const [toys, setToys] = useState<Toy[]>(() => [makeToy(0, 'ball', 0, 0)]);
  const nextId = useRef(1);
  useEffect(() => () => sound.dispose(), [sound]);

  const drop = (x: number, z: number) => {
    setToys((current) => addToy(current, makeToy(nextId.current++, kind, x, z)));
    sound.drop();
  };
  const clear = () => {
    setToys([]);
    sound.clear();
  };

  return (
    <div className="pg-root">
      <Sandbox toys={toys} paused={paused} onDrop={drop} onBounce={sound.bounce} />
      <p className="pg-hint">{t.hint}</p>
      <nav className="pg-dock" aria-label={t.toys}>
        {TOY_KINDS.map((item) => (
          <button
            key={item.kind}
            className={kind === item.kind ? 'is-active' : ''}
            aria-pressed={kind === item.kind}
            onClick={() => setKind(item.kind)}
          >
            <span aria-hidden>{item.emoji}</span>
            <small>{t.toy[item.kind]}</small>
          </button>
        ))}
        <button className="pg-clear" onClick={clear} disabled={!toys.length}>
          <span aria-hidden>🧹</span>
          <small>{t.clear}</small>
        </button>
      </nav>
    </div>
  );
}
