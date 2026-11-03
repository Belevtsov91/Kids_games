import type { Quest } from '../game/quests';
import { tr } from '../i18n';

/** Тост о выполненном задании (по одному за раз) и подсказка к инструменту. */
export function Notifications({ toasts, hint }: { toasts: Quest[]; hint: string | null }) {
  return (
    <>
      <div className="ib-toasts" aria-live="polite">
        {toasts.slice(0, 1).map((q) => (
          <div key={q.id} className="ib-toast">
            <span className="ib-toast-emoji">{q.emoji}</span>
            <div>
              <strong>{tr().questDone}</strong>
              <span>{tr().questTitles[q.id] ?? q.title}</span>
            </div>
          </div>
        ))}
      </div>
      {hint && <div className="ib-hint">{hint}</div>}
    </>
  );
}
