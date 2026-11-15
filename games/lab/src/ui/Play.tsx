// Экран задания: собираем машину, жмём «Пуск», смотрим, зажглась ли лампа.
import { useEffect, useMemo, useRef, useState } from 'react';
import { canPlace, leftOf, machineOf, place, removeAt } from '../game/board';
import type { Level } from '../game/levels/types';
import { nextVariant, type PartKind, type Placed } from '../game/parts';
import { starsFor } from '../game/score';
import type { Sound } from '../audio/sound';
import { levelText, type Texts } from '../i18n';
import { LabScene } from '../scene/LabScene';
import { startRun, type Outcome, type Run } from '../sim/run';
import type { Rapier } from '../sim/world';
import { Dock, type Tool } from './Dock';
import { ResultCard } from './ResultCard';

interface Props {
  t: Texts;
  rapier: Rapier;
  level: Level;
  index: number;
  paused: boolean;
  still: boolean;
  sound: Sound;
  hasNext: boolean;
  onFinish(stars: number): void;
  onMap(): void;
  onNext(): void;
}

type Mode = 'build' | 'run' | 'lit' | 'lost';

const firstKind = (level: Level) => (Object.keys(level.inventory) as PartKind[])[0] ?? 'ramp';
const same = (a: Omit<Placed, 'id'>, b: Omit<Placed, 'id'>) => a.kind === b.kind && a.col === b.col && a.row === b.row && a.variant === b.variant;

export function Play({ t, rapier, level, index, paused, still, sound, hasNext, onFinish, onMap, onNext }: Props) {
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [tool, setTool] = useState<Tool>(firstKind(level));
  const [mode, setMode] = useState<Mode>('build');
  const [result, setResult] = useState({ stars: 0, star: false, par: false });
  const [say, setSay] = useState(t.teppa.hello);
  const [hinting, setHinting] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const runRef = useRef<Run | null>(null);
  const nextId = useRef(1);
  const [name, tip] = levelText(t, level.id);

  const stopRun = () => {
    const run = runRef.current;
    runRef.current = null;
    run?.lab.world.free();
  };
  useEffect(() => stopRun, []);
  // Карточку победы показываем не сразу: пусть ребёнок увидит, как зажглась лампа.
  useEffect(() => {
    if (mode !== 'lit') return setShowCard(false);
    const timer = setTimeout(() => setShowCard(true), 1300);
    return () => clearTimeout(timer);
  }, [mode]);

  const ghost = useMemo(() => {
    if (!hinting) return null;
    const missing = level.solution.find((s) => !placed.some((p) => same(p, s)));
    return missing ? { ...missing, id: -999 } : null;
  }, [hinting, level, placed]);

  const toBuild = () => {
    stopRun();
    setMode('build');
  };

  const onCell = (col: number, row: number) => {
    if (mode !== 'build') return;
    if (tool === 'remove') {
      setPlaced((current) => removeAt(current, col, row));
      return sound.clear();
    }
    const next = place(level, placed, { id: nextId.current, kind: tool, col, row, variant: 0 });
    if (next === placed) return;
    nextId.current++;
    setPlaced(next);
    sound.place();
  };

  const onPart = (part: Placed) => {
    if (mode !== 'build') return;
    if (tool === 'remove') {
      setPlaced((current) => current.filter((p) => p.id !== part.id));
      return sound.clear();
    }
    setPlaced((current) => current.map((p) => (p.id === part.id ? nextVariant(p) : p)));
    sound.turn();
  };

  const go = () => {
    stopRun();
    runRef.current = startRun(rapier, level, machineOf(level, placed));
    setMode('run');
    sound.start();
  };

  const onOutcome = (outcome: Outcome) => {
    const run = runRef.current;
    if (outcome === 'lit') {
      const star = run?.star ?? false;
      const got = starsFor(level, { lit: true, star, used: placed.length });
      setResult({ stars: got, star, par: placed.length <= level.par });
      setMode('lit');
      setSay(t.teppa.lit);
      setHinting(false);
      sound.lit();
      onFinish(got);
    } else {
      setMode('lost');
      setSay(t.teppa.lost);
      sound.lost();
      onFinish(0);
    }
  };

  const hint = () => {
    const missing = level.solution.find((s) => !placed.some((p) => same(p, s)));
    setHinting(true);
    setSay(missing ? t.teppa.hint : t.teppa.noHint);
    if (missing) setTool(missing.kind);
  };

  return (
    <div className="lab-play">
      <LabScene
        level={level}
        machine={machineOf(level, placed)}
        runRef={runRef}
        running={mode === 'run'}
        lit={mode === 'lit'}
        paused={paused}
        still={still}
        ghost={mode === 'build' ? ghost : null}
        canPlace={(col, row) => tool === 'remove' || (leftOf(level, placed, tool) > 0 && canPlace(level, placed, col, row))}
        onCell={onCell}
        onPart={onPart}
        onOutcome={onOutcome}
        onHit={sound.tick}
      />
      <header className="lab-top">
        <button className="lab-round" onClick={onMap} aria-label={t.map}>
          ←
        </button>
        <div className="lab-title">
          <b>
            {t.level} {index + 1}. {name}
          </b>
          <small>{tip}</small>
          <small className="lab-par">⭐ {t.parTip(level.par)}</small>
        </div>
        <button className="lab-round" onClick={hint} disabled={mode !== 'build'} aria-label={t.hint}>
          💡
        </button>
      </header>
      <p className="lab-bubble" role="status">
        <span aria-hidden>🐻</span> {say}
      </p>
      <Dock
        t={t}
        level={level}
        placed={placed}
        tool={tool}
        mode={mode}
        onTool={setTool}
        onGo={go}
        onReset={toBuild}
        onClear={() => (setPlaced([]), sound.clear())}
      />
      {mode === 'lit' && showCard && <ResultCard t={t} {...result} hasNext={hasNext} onNext={onNext} onAgain={toBuild} />}
      {mode === 'lost' && (
        <div className="lab-toast">
          <b>{t.lostTitle}</b> {t.lostTip}
          <button onClick={toBuild}>🔧 {t.build}</button>
        </div>
      )}
    </div>
  );
}
