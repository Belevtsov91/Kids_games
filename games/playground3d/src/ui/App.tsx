import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { GameSdk } from '@ig/sdk';
import { addToy, makeToy, TOY_KINDS, type Toy, type ToyKind } from '../game/toys';
import { createSound } from '../audio/sound';
import { Sandbox } from '../scene/Sandbox';
import '../styles/sandbox.css';

export interface PauseStore {
  subscribe(listener: () => void): () => void;
  get(): boolean;
}

export function App({ sdk, pause }: { sdk: GameSdk; pause: PauseStore }) {
  const paused = useSyncExternalStore(pause.subscribe, pause.get, pause.get);
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
      <p className="pg-hint">Нажми на траву — упадёт игрушка. Нажми на игрушку — она подпрыгнет!</p>
      <nav className="pg-dock" aria-label="Игрушки">
        {TOY_KINDS.map((item) => (
          <button
            key={item.kind}
            className={kind === item.kind ? 'is-active' : ''}
            aria-pressed={kind === item.kind}
            onClick={() => setKind(item.kind)}
          >
            <span aria-hidden>{item.emoji}</span>
            <small>{item.label}</small>
          </button>
        ))}
        <button className="pg-clear" onClick={clear} disabled={!toys.length}>
          <span aria-hidden>🧹</span>
          <small>Убрать</small>
        </button>
      </nav>
    </div>
  );
}
