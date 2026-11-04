import { useState } from 'react';
import type { GameManifest } from '@ig/sdk';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { doneToday, markToday } from './daily';
import { useFamilyText } from './text';

/** «Попробуй дома»: маленькое задание без экрана по навыку последней игры. Раз в день, отметка на устройстве. */
export function OfflineTask({ childId, game, onDone }: { childId: string; game: GameManifest; onDone?: (text: string) => void }) {
  const f = useFamilyText().offline;
  const { locale } = useI18n();
  const skill = game.skills?.find((s) => f.tasks[s]);
  const [done, setDone] = useState(() => doneToday('offline', childId, game.id));
  if (!skill) return null;
  const finish = () => {
    markToday('offline', childId, game.id);
    setDone(true);
    onDone?.(f.thanks);
  };
  return (
    <section className={`family-card offline-task${done ? ' is-done' : ''}`} data-testid="offline-task">
      <h2>🏡 {f.title}</h2>
      <p className="family-muted">{f.after(gameTitle(game, locale))}</p>
      <p className="offline-text">{f.tasks[skill]}</p>
      <button type="button" className="dash-btn dash-btn-ghost" onClick={finish} disabled={done}>
        {f.done}
      </button>
    </section>
  );
}
