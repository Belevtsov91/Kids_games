import type { GameManifest } from '@ig/sdk';
import { isNewGame, subjectsIn, type MenuFilter } from '@/catalog/subjects';
import { useI18n } from '@/i18n/I18nProvider';

/**
 * Кнопки над полкой: «Все», «Новые», «3D-миры» и предметы (счёт, буквы, логика…).
 * Кнопка появляется, только если под ней есть хотя бы одна игра из `games`: пустых фильтров ребёнок не увидит.
 */
export function MenuFilters({ games, value, onChange }: { games: GameManifest[]; value: MenuFilter; onChange: (f: MenuFilter) => void }) {
  const { t } = useI18n();
  const f = t.menu.filter;
  const options: MenuFilter[] = [
    'all',
    ...(games.some((g) => isNewGame(g)) ? (['new'] as const) : []),
    ...(games.some((g) => g.kind === '3d') ? (['3d'] as const) : []),
    ...subjectsIn(games),
  ];
  return (
    <div className="dash-filters" role="group" aria-label={f.label}>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={o === value} onClick={() => onChange(o)}>
          {f[o]}
        </button>
      ))}
    </div>
  );
}
