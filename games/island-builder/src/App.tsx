import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { GameSdk } from '@ig/sdk';
import Scene, { type Effect, type Floater, type TapTarget, type Vec3 } from './Scene';
import { BLOCKS, TOOLS, TREES, type Tool } from './blocks';
import { QUESTS, newlyDone, questState, type Quest } from './quests';
import { sound } from './sound';
import {
  BLOCK_TYPES,
  GRID,
  MAX_TREES,
  TREE_KINDS,
  applyChanges,
  cellToWorld,
  columnHeight,
  deserialize,
  emptyStats,
  emptyWorld,
  flatIsland,
  generateIsland,
  paintBlock,
  placeBlock,
  plantTree,
  removeBlock,
  removeTree,
  serialize,
  worldToCell,
  type BlockType,
  type Cell,
  type Change,
  type Stats,
  type TreeKind,
  type World,
} from './world';
import './island.css';

const MAX_BOATS = 10;
const MAX_CRATES = 16;
const HISTORY = 100;
const SAVE_DELAY = 1500;
const BOAT_COLORS = ['#e5484d', '#3e8ef7', '#f5a524', '#8e4ec6', '#12a594', '#ff7eb6'];

type SaveStatus = 'loading' | 'saved' | 'saving' | 'offline';

interface Props {
  sdk: GameSdk;
  paused: boolean;
}

export default function App({ sdk, paused }: Props) {
  const [world, setWorld] = useState<World>(emptyWorld);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [night, setNight] = useState(false);
  const [achieved, setAchieved] = useState<string[]>([]);
  const [past, setPast] = useState<Change[][]>([]);
  const [tool, setTool] = useState<Tool>('build');
  const [material, setMaterial] = useState<BlockType>('grass');
  const [treeKind, setTreeKind] = useState<TreeKind>('round');
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [showQuests, setShowQuests] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [toasts, setToasts] = useState<Quest[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(false);

  const worldRef = useRef(world);
  worldRef.current = world;
  const nextId = useRef(1);
  // Пока остров не загружен, не сохраняем и не проверяем задания.
  const [ready, setReady] = useState(false);

  // ---------- Загрузка и сохранение через сервер игры ----------

  useEffect(() => {
    let cancelled = false;
    sdk.api
      .get<{ island: unknown }>('/island')
      .then((res) => {
        if (cancelled) return;
        const island = deserialize(res.island);
        if (island) {
          setWorld(island.world);
          setStats(island.stats);
          setNight(island.night);
          setAchieved(island.achieved);
        } else {
          setWorld(generateIsland(Date.now() % 100000));
          setWelcome(true);
        }
        setStatus('saved');
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Сервер недоступен: играть всё равно можно, просто без сохранения.
        setWorld(generateIsland(Date.now() % 100000));
        setWelcome(true);
        setStatus('offline');
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sdk]);

  const snapshot = useMemo(() => serialize({ world, stats, night, achieved }), [world, stats, night, achieved]);
  const pending = useRef<ReturnType<typeof serialize> | null>(null);

  const flush = useCallback(() => {
    const data = pending.current;
    if (!data) return Promise.resolve();
    pending.current = null;
    setStatus('saving');
    return sdk.api
      .post('/island', data)
      .then(() => setStatus((s) => (pending.current ? s : 'saved')))
      .catch(() => setStatus('offline'));
  }, [sdk]);

  useEffect(() => {
    if (!ready) return;
    pending.current = snapshot;
    const timer = setTimeout(() => void flush(), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [ready, snapshot, flush]);

  // Выход из игры: несохранённое уходит на сервер сразу.
  useEffect(() => () => void flush(), [flush]);

  // ---------- Звук ----------

  useEffect(() => {
    const start = () => sound.startAmbience();
    window.addEventListener('pointerdown', start, { once: true });
    return () => window.removeEventListener('pointerdown', start);
  }, []);

  // ---------- Задания ----------

  useEffect(() => {
    if (!ready) return;
    const done = newlyDone(world, stats, achieved);
    if (!done.length) return;
    setAchieved((a) => [...a, ...done.map((q) => q.id)]);
    setToasts((t) => [...t, ...done]);
    sound.quest();
  }, [ready, world, stats, achieved]);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => setToasts((t) => t.slice(1)), 3200);
    return () => clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(null), 3500);
    return () => clearTimeout(timer);
  }, [hint]);

  // ---------- Действия ----------

  const puff = (cell: Cell, color: string) => {
    setEffects((list) => [...list.slice(-12), { id: nextId.current++, pos: cellToWorld(cell), color }]);
  };

  const commit = (changes: Change[]) => {
    if (!changes.length) return false;
    setWorld((w) => applyChanges(w, changes));
    setPast((p) => [...p.slice(-(HISTORY - 1)), changes]);
    return true;
  };

  const bump = (key: keyof Stats) => setStats((s) => ({ ...s, [key]: s[key] + 1 }));

  const spawn = (kind: Floater['kind'], pos: Vec3) => {
    const limit = kind === 'boat' ? MAX_BOATS : MAX_CRATES;
    const floater: Floater = {
      id: nextId.current++,
      kind,
      pos,
      rot: Math.random() * Math.PI * 2,
      color: BOAT_COLORS[Math.floor(Math.random() * BOAT_COLORS.length)],
    };
    setFloaters((list) => {
      const same = list.filter((f) => f.kind === kind);
      // Старые лодки и ящики уплывают, чтобы сцена не тормозила.
      const drop = same.length >= limit ? same[0].id : null;
      return [...list.filter((f) => f.id !== drop), floater];
    });
  };

  const handleTap = (target: TapTarget) => {
    const w = worldRef.current;
    let ok = false;
    switch (tool) {
      case 'build': {
        let cell: Cell | null = null;
        if (target.kind === 'block') cell = { x: target.cell.x + target.normal.x, y: target.cell.y + target.normal.y, z: target.cell.z + target.normal.z };
        else if (target.kind === 'seabed') cell = { ...worldToCell(target.point[0], 0, target.point[2]), y: 0 };
        if (cell && commit(placeBlock(w, cell, material))) {
          ok = true;
          bump('placed');
          sound.place(BLOCKS[material].pitch);
          puff(cell, BLOCKS[material].top);
        }
        break;
      }
      case 'paint':
        if (target.kind === 'block' && commit(paintBlock(w, target.cell, material))) {
          ok = true;
          bump('painted');
          sound.paint();
          puff(target.cell, BLOCKS[material].top);
        }
        break;
      case 'dig': {
        const changes = target.kind === 'block' ? removeBlock(w, target.cell) : target.kind === 'tree' ? removeTree(w, target.cell) : [];
        if (commit(changes)) {
          ok = true;
          if (target.kind === 'block') {
            bump('dug');
            puff(target.cell, BLOCKS[w.blocks.get(changes[0].key) as BlockType].side);
          } else if (target.kind === 'tree') puff(target.cell, '#4cbb4c');
          sound.dig();
        }
        break;
      }
      case 'tree':
        if (target.kind === 'block' && target.normal.y === 1) {
          const cell = { ...target.cell, y: target.cell.y + 1 };
          if (w.trees.size >= MAX_TREES) setHint('Деревьев уже очень много — выкопай какое-нибудь');
          else if (commit(plantTree(w, cell, treeKind))) {
            ok = true;
            bump('planted');
            sound.plant();
            puff(cell, '#7be07b');
          }
        }
        break;
      case 'boat':
        if (target.kind === 'water') {
          const cell = worldToCell(target.point[0], 0, target.point[2]);
          const onIsland = cell.x >= 0 && cell.x < GRID && cell.z >= 0 && cell.z < GRID && columnHeight(w, cell.x, cell.z) > 0;
          if (!onIsland) {
            ok = true;
            spawn('boat', [target.point[0], 1.6, target.point[2]]);
            bump('boats');
            sound.boat();
          }
        }
        if (!ok) setHint('Лодку можно спустить только на воду');
        break;
      case 'crate':
        ok = true;
        spawn('crate', [target.point[0], 10, target.point[2]]);
        bump('crates');
        sound.crate();
        break;
    }
    if (!ok) sound.denied();
  };

  const undo = () => {
    const last = past[past.length - 1];
    if (!last) return sound.denied();
    setPast((p) => p.slice(0, -1));
    setWorld((w) => applyChanges(w, last, true));
    sound.undo();
  };

  const toggleNight = () => {
    setNight((n) => {
      sound.dayNight(!n);
      return !n;
    });
  };

  const newIsland = (kind: 'random' | 'flat' | 'empty') => {
    setWorld(kind === 'random' ? generateIsland(Math.floor(Math.random() * 100000)) : kind === 'flat' ? flatIsland() : emptyWorld());
    setPast([]);
    setFloaters([]);
    setShowNew(false);
    sound.dayNight(false);
  };

  const pickTool = (id: Tool) => {
    setTool(id);
    setHint(TOOLS.find((t) => t.id === id)!.hint);
    sound.click();
  };

  const quests = questState(world, stats, achieved);
  const doneCount = quests.filter((q) => q.done).length;

  return (
    <div className={`ib-root${night ? ' ib-night' : ''}`}>
      <Scene
        world={world}
        tool={tool}
        material={material}
        night={night}
        paused={paused}
        floaters={floaters}
        effects={effects}
        onTap={handleTap}
        onFloaterGone={(id) => setFloaters((list) => list.filter((f) => f.id !== id))}
        onFloaterPush={() => sound.push()}
        onCrateLand={() => sound.thud()}
        onEffectDone={(id) => setEffects((list) => list.filter((e) => e.id !== id))}
      />

      <header className="ib-top">
        <div className="ib-chip ib-title">
          <span className="ib-title-emoji">🏝️</span>
          <span className="ib-title-text">Остров-конструктор</span>
          <span className={`ib-status ib-status-${status}`} title={STATUS_TEXT[status]}>
            {STATUS_TEXT[status]}
          </span>
        </div>
        <div className="ib-actions">
          <button className="ib-round ib-undo" onClick={undo} disabled={!past.length} aria-label="Отменить" title="Отменить">
            ↶
          </button>
          <button className="ib-round" onClick={toggleNight} aria-label={night ? 'Сделать день' : 'Сделать ночь'} title={night ? 'День' : 'Ночь'}>
            {night ? '☀️' : '🌙'}
          </button>
          <button
            className={`ib-round${showQuests ? ' ib-on' : ''}`}
            onClick={() => {
              setShowQuests((v) => !v);
              sound.click();
            }}
            aria-label="Задания"
            title="Задания"
          >
            🏆<span className="ib-badge">{doneCount}/{QUESTS.length}</span>
          </button>
          <button
            className="ib-round"
            onClick={() => {
              setShowNew(true);
              sound.click();
            }}
            aria-label="Новый остров"
            title="Новый остров"
          >
            🗺️
          </button>
        </div>
      </header>

      {showQuests && (
        <section className="ib-card ib-quests" aria-label="Задания">
          <h2>Задания</h2>
          <ul>
            {quests.map(({ quest, value, done }) => (
              <li key={quest.id} className={done ? 'ib-done' : ''}>
                <span className="ib-quest-emoji">{done ? '✅' : quest.emoji}</span>
                <div className="ib-quest-body">
                  <span>{quest.title}</span>
                  <div className="ib-bar">
                    <div style={{ width: `${(value / quest.goal) * 100}%` }} />
                  </div>
                </div>
                <span className="ib-quest-count">
                  {value}/{quest.goal}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ib-toasts" aria-live="polite">
        {toasts.slice(0, 1).map((q) => (
          <div key={q.id} className="ib-toast">
            <span className="ib-toast-emoji">{q.emoji}</span>
            <div>
              <strong>Задание выполнено!</strong>
              <span>{q.title}</span>
            </div>
          </div>
        ))}
      </div>

      {hint && <div className="ib-hint">{hint}</div>}

      <nav className="ib-dock">
        {(tool === 'build' || tool === 'paint') && (
          <div className="ib-row ib-palette" role="radiogroup" aria-label="Материал">
            {BLOCK_TYPES.map((type) => (
              <button
                key={type}
                role="radio"
                aria-checked={material === type}
                className={`ib-swatch${material === type ? ' ib-on' : ''}`}
                style={{ '--top': BLOCKS[type].top, '--side': BLOCKS[type].side } as CSSProperties}
                onClick={() => {
                  setMaterial(type);
                  sound.place(BLOCKS[type].pitch);
                }}
                title={BLOCKS[type].label}
              >
                <span className="ib-cube" />
                <span className="ib-label">{BLOCKS[type].label}</span>
              </button>
            ))}
          </div>
        )}
        {tool === 'tree' && (
          <div className="ib-row ib-palette" role="radiogroup" aria-label="Растение">
            {TREE_KINDS.map((kind) => (
              <button
                key={kind}
                role="radio"
                aria-checked={treeKind === kind}
                className={`ib-swatch${treeKind === kind ? ' ib-on' : ''}`}
                onClick={() => {
                  setTreeKind(kind);
                  sound.click();
                }}
              >
                <span className="ib-emoji">{TREES[kind].emoji}</span>
                <span className="ib-label">{TREES[kind].label}</span>
              </button>
            ))}
          </div>
        )}
        <div className="ib-row ib-tools" role="radiogroup" aria-label="Инструмент">
          {TOOLS.map((t) => (
            <button key={t.id} role="radio" aria-checked={tool === t.id} className={`ib-tool${tool === t.id ? ' ib-on' : ''}`} onClick={() => pickTool(t.id)}>
              <span className="ib-emoji">{t.emoji}</span>
              <span className="ib-label">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showNew && (
        <div className="ib-modal" role="dialog" aria-modal="true" aria-label="Новый остров" onClick={() => setShowNew(false)}>
          <div className="ib-card ib-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Новый остров</h2>
            <p>Текущий остров исчезнет. Задания и счётчики останутся.</p>
            <div className="ib-choices">
              <button className="ib-choice" onClick={() => newIsland('random')}>
                <span>🎲</span>Случайный остров
              </button>
              <button className="ib-choice" onClick={() => newIsland('flat')}>
                <span>🟩</span>Ровная поляна
              </button>
              <button className="ib-choice" onClick={() => newIsland('empty')}>
                <span>🌊</span>Только море
              </button>
            </div>
            <button className="ib-cancel" onClick={() => setShowNew(false)}>
              Оставить как есть
            </button>
          </div>
        </div>
      )}

      {!ready && (
        <div className="ib-loading">
          <div>
            <span>🏝️</span>Плывём к острову…
          </div>
        </div>
      )}

      {welcome && (
        <div className="ib-modal" role="dialog" aria-modal="true" aria-label="Как играть">
          <div className="ib-card ib-dialog">
            <h2>🏝️ Твой остров!</h2>
            <ul className="ib-howto">
              <li>
                <span>👆</span>Нажми на остров — поставишь блок
              </li>
              <li>
                <span>🔄</span>Веди пальцем или мышью — крути камеру
              </li>
              <li>
                <span>🤏</span>Двумя пальцами или колёсиком — приближай
              </li>
              <li>
                <span>🏆</span>Выполняй задания и строй что захочешь
              </li>
            </ul>
            <button
              className="ib-start"
              onClick={() => {
                setWelcome(false);
                sound.quest();
                sound.startAmbience();
              }}
            >
              Строить!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_TEXT: Record<SaveStatus, string> = {
  loading: 'Загрузка…',
  saving: 'Сохраняю…',
  saved: 'Сохранено ✓',
  offline: 'Без сохранения',
};
