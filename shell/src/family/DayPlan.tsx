import type { GameManifest } from '@ig/sdk';
import { covers } from '@/catalog/covers';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { useFamilyText } from './text';

/** План дня от взрослого: до трёх игр с галочками «сыграно сегодня». */
export function DayPlan({ plan, played, onPlay }: { plan: GameManifest[]; played: string[]; onPlay: (g: GameManifest) => void }) {
  const f = useFamilyText().plan;
  const { locale } = useI18n();
  if (!plan.length) return null;
  return (
    <section className="family-card day-plan" aria-label={f.title} data-testid="day-plan">
      <h2>📋 {f.title}</h2>
      <ol>
        {plan.map((g) => {
          const done = played.includes(g.id);
          return (
            <li key={g.id} className={done ? 'is-done' : undefined}>
              <button type="button" onClick={() => onPlay(g)}>
                <img src={covers[g.id]} alt="" width="48" height="48" />
                <span>{gameTitle(g, locale)}</span>
                <b aria-label={done ? f.done : undefined}>{done ? '✓' : '▶'}</b>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
