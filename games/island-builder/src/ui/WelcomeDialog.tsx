/** Подсказка «как играть» для нового острова. */
export function WelcomeDialog({ onStart }: { onStart(): void }) {
  return (
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
        <button className="ib-start" onClick={onStart}>
          Строить!
        </button>
      </div>
    </div>
  );
}
