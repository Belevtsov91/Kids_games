import { LEVELS } from '../game/levels';
import { isOpen, totalStars, type Best } from '../game/score';
import { levelText, type Texts } from '../i18n';

/** Список заданий: открытые, закрытые и сколько звёзд собрано в каждом. */
export function LevelMap({ t, best, onPick }: { t: Texts; best: Best; onPick(index: number): void }) {
  const done = LEVELS.every((l) => (best[l.id] ?? 0) > 0);
  return (
    <div className="lab-map">
      <h1>🔬 {t.title}</h1>
      <p className="lab-map-bear">
        <span aria-hidden>🐻</span> {done ? t.allDone : t.goal}
      </p>
      <p className="lab-map-total">
        ★ {t.stars}: {totalStars(best)} / {LEVELS.length * 3}
      </p>
      <h2>{t.pickLevel}</h2>
      <ol className="lab-levels">
        {LEVELS.map((level, i) => {
          const open = isOpen(LEVELS, best, i);
          const got = best[level.id] ?? 0;
          return (
            <li key={level.id}>
              <button disabled={!open} title={open ? undefined : t.locked} onClick={() => onPick(i)}>
                <b>{open ? i + 1 : '🔒'}</b>
                <span>{levelText(t, level.id)[0]}</span>
                <small aria-label={`${got} / 3`}>{[0, 1, 2].map((s) => (s < got ? '★' : '☆')).join('')}</small>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
