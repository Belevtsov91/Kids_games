import type { questState } from '../game/quests';

/** Список заданий с прогресс-барами. */
export function QuestsPanel({ quests }: { quests: ReturnType<typeof questState> }) {
  return (
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
  );
}
