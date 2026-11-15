import { leftOf } from '../game/board';
import type { Level } from '../game/levels/types';
import { partInfo, type PartKind, type Placed } from '../game/parts';
import type { Texts } from '../i18n';

export type Tool = PartKind | 'remove';

interface Props {
  t: Texts;
  level: Level;
  placed: Placed[];
  tool: Tool;
  mode: 'build' | 'run' | 'lit' | 'lost';
  onTool(tool: Tool): void;
  onGo(): void;
  onReset(): void;
  onClear(): void;
}

/** Нижняя панель: запас деталей, ластик и кнопка «Пуск». */
export function Dock({ t, level, placed, tool, mode, onTool, onGo, onReset, onClear }: Props) {
  const kinds = Object.keys(level.inventory) as PartKind[];
  const building = mode === 'build';
  return (
    <nav className="lab-dock" aria-label={t.tapCell}>
      <div className="lab-parts">
        {kinds.map((kind) => {
          const left = leftOf(level, placed, kind);
          return (
            <button
              key={kind}
              className={tool === kind ? 'is-active' : ''}
              aria-pressed={tool === kind}
              disabled={!building}
              onClick={() => onTool(kind)}
            >
              <span aria-hidden>{partInfo(kind).emoji}</span>
              <small>{t.part[kind]}</small>
              <em aria-label={t.left}>{left}</em>
            </button>
          );
        })}
        <button className={tool === 'remove' ? 'is-active' : ''} aria-pressed={tool === 'remove'} disabled={!building} onClick={() => onTool('remove')}>
          <span aria-hidden>🧽</span>
          <small>{t.remove}</small>
        </button>
        <button disabled={!building || !placed.length} onClick={onClear}>
          <span aria-hidden>🧹</span>
          <small>{t.clear}</small>
        </button>
      </div>
      {building ? (
        <button className="lab-go" onClick={onGo}>
          ▶ {t.run}
        </button>
      ) : (
        <button className="lab-go is-reset" onClick={onReset}>
          ⟲ {t.reset}
        </button>
      )}
    </nav>
  );
}
