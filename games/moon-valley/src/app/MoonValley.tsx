import { useEffect, useMemo, useState } from 'react';
import type { GameSdk } from '@ig/sdk';
import cover from '../../assets/moon-valley-cover.png';
import { addXp, befriend, initialState, tendPlot, type PetKind, type ValleyState, xpForNext } from '../game/valley';
import { valleySound } from '../audio/sound';
import { ValleyScene } from '../scene/ValleyScene';
import '../styles/index.css';

const ZONES = [
  { id: 'home', icon: '🏡', title: 'Сад у дома', level: 1 },
  { id: 'forest', icon: '🌲', title: 'Светящийся лес', level: 2 },
  { id: 'lake', icon: '🫧', title: 'Озеро облаков', level: 3 },
  { id: 'mountain', icon: '⛰️', title: 'Горный питомник', level: 4 },
];

export function MoonValley({ sdk }: { sdk: GameSdk }) {
  const [state, setState] = useState<ValleyState>(() => sdk.storage.load<ValleyState>('save') ?? initialState());
  const [started, setStarted] = useState(false);
  const [night, setNight] = useState(false);
  const [notice, setNotice] = useState('Добро пожаловать, Хранитель!');
  useEffect(() => {
    sdk.storage.save('save', state);
  }, [sdk, state]);
  useEffect(() => {
    const stop = sdk.audio.onMuteChange((muted) => (muted ? valleySound.stop() : valleySound.start(false)));
    return () => {
      stop();
      valleySound.stop();
    };
  }, [sdk]);
  const quest = useMemo(
    () => ({
      grown: state.plots.filter((plot) => plot.stage >= 2).length,
      friends: state.pets.filter((pet) => pet.affection >= 40).length,
    }),
    [state],
  );
  const actPlot = (id: number) => {
    const before = state.plots.find((plot) => plot.id === id);
    const next = tendPlot(state, id);
    setState(next);
    if (next === state) setNotice(before?.stage === 0 ? 'Нужны семена. Исследуй долину!' : 'Нужна вода или этот цветок уже ждёт урожая.');
    else {
      valleySound.chime();
      setNotice(
        before?.stage === 3
          ? 'Собран лунный цветок: +8 звёздного света.'
          : before?.stage === 0
            ? 'Семечко посажено! Полей его ещё два раза.'
            : 'Растение стало сильнее.',
      );
    }
  };
  const actPet = (id: PetKind) => {
    const pet = state.pets.find((item) => item.id === id);
    if (!pet?.unlocked) return setNotice('Этот питомец появится после нового уровня.');
    setState((current) => befriend(current, id));
    valleySound.chime();
    setNotice(`${pet.name} радуется твоей заботе!`);
  };
  const explore = () => {
    const gain = 5 + state.level * 2;
    setState((current) =>
      addXp({ ...current, seeds: current.seeds + 1, water: current.water + 1, starlight: current.starlight + gain }, 12),
    );
    valleySound.chime();
    setNotice(`Находка: +1 семя, +1 вода и +${gain} света!`);
  };
  const collect = () => {
    setState((current) => ({ ...current, starlight: current.starlight + 2 }));
    setNotice('Кристалл подарил 2 звёздного света.');
  };
  const buildGreenhouse = () => {
    if (state.buildings.includes('greenhouse')) return setNotice('Оранжерея уже сияет рядом с домом.');
    if (state.starlight < 15) return setNotice('Для оранжереи нужно ещё немного звёздного света: 15.');
    setState((current) => ({ ...current, starlight: current.starlight - 15, buildings: [...current.buildings, 'greenhouse'] }));
    valleySound.chime();
    setNotice('Оранжерея восстановлена! Теперь долина стала уютнее.');
  };
  const start = () => {
    setStarted(true);
    valleySound.start(sdk.audio.muted);
  };
  useEffect(() => {
    setState((current) => ({
      ...current,
      pets: current.pets.map((pet) =>
        pet.id === 'owl' ? { ...pet, unlocked: current.level >= 2 } : pet.id === 'bunny' ? { ...pet, unlocked: current.level >= 3 } : pet,
      ),
    }));
  }, [state.level]);
  if (!started)
    return (
      <main
        className="mv-intro"
        style={{ backgroundImage: `linear-gradient(90deg, rgb(14 25 54 / .84), rgb(14 25 54 / .2)), url(${cover})` }}
      >
        <section>
          <span className="mv-moon">☾</span>
          <p>Уютная 3D RPG</p>
          <h1>
            Хранители
            <br />
            Лунной Долины
          </h1>
          <p>Верни свет волшебным землям, вырасти сад и подружись с питомцами.</p>
          <button onClick={start}>Начать приключение ✨</button>
          <button className="mv-link" onClick={sdk.exit}>
            В меню
          </button>
        </section>
      </main>
    );
  return (
    <main className="moon-valley">
      <div className="mv-scene">
        <ValleyScene
          plots={state.plots}
          pets={state.pets}
          greenhouse={state.buildings.includes('greenhouse')}
          night={night}
          onPlot={actPlot}
          onPet={actPet}
          onCollect={collect}
        />
      </div>
      <header className="mv-top">
        <button onClick={sdk.exit} aria-label="В меню">
          ←
        </button>
        <div>
          <strong>Хранитель · ур. {state.level}</strong>
          <div className="mv-xp">
            <i style={{ width: `${Math.min(100, (state.xp / xpForNext(state.level)) * 100)}%` }} />
          </div>
        </div>
        <span>✨ {state.starlight}</span>
        <button onClick={() => setNight((value) => !value)}>{night ? '☀️' : '🌙'}</button>
      </header>
      <aside className="mv-panel">
        <h2>Лунная долина</h2>
        <p>{notice}</p>
        <div className="mv-resources">
          <span>🌱 {state.seeds}</span>
          <span>💧 {state.water}</span>
          <span>🌟 {state.starlight}</span>
        </div>
        <button className="mv-action" onClick={explore}>
          🧭 Исследовать
        </button>
        <button className="mv-build" onClick={buildGreenhouse}>
          {state.buildings.includes('greenhouse') ? '🏡 Оранжерея готова' : '🔨 Построить оранжерею · 15 ✨'}
        </button>
        <h3>Питомцы</h3>
        {state.pets.map((pet) => (
          <button key={pet.id} className={`mv-pet ${pet.unlocked ? '' : 'locked'}`} onClick={() => actPet(pet.id)}>
            <span>{pet.id === 'fox' ? '🦊' : pet.id === 'owl' ? '🦉' : '🐇'}</span>
            <b>{pet.unlocked ? pet.name : `Откроется на ур. ${pet.id === 'owl' ? 2 : 3}`}</b>
            {pet.unlocked && <small>дружба {pet.affection}/100</small>}
          </button>
        ))}
        <h3>Земли</h3>
        <div className="mv-zones">
          {ZONES.map((zone) => (
            <span key={zone.id} className={state.level >= zone.level ? '' : 'locked'} title={zone.title}>
              {zone.icon}
            </span>
          ))}
        </div>
        <div className="mv-quests">
          <b>Сегодня</b>
          <span>🌸 Вырасти цветы: {quest.grown}/3</span>
          <span>💛 Подружись: {quest.friends}/1</span>
        </div>
      </aside>
      <div className="mv-hint">Нажимай на грядки, питомцев и сияющие кристаллы в мире.</div>
    </main>
  );
}
