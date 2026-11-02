import type { NewIslandKind } from '../app/useIslandActions';

/** Выбор нового острова. Клик мимо окна — закрыть. */
export function NewIslandDialog({ onPick, onClose }: { onPick(kind: NewIslandKind): void; onClose(): void }) {
  return (
    <div className="ib-modal" role="dialog" aria-modal="true" aria-label="Новый остров" onClick={onClose}>
      <div className="ib-card ib-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Новый остров</h2>
        <p>Текущий остров исчезнет. Задания и счётчики останутся.</p>
        <div className="ib-choices">
          <button className="ib-choice" onClick={() => onPick('random')}>
            <span>🎲</span>Случайный остров
          </button>
          <button className="ib-choice" onClick={() => onPick('flat')}>
            <span>🟩</span>Ровная поляна
          </button>
          <button className="ib-choice" onClick={() => onPick('empty')}>
            <span>🌊</span>Только море
          </button>
        </div>
        <button className="ib-cancel" onClick={onClose}>
          Оставить как есть
        </button>
      </div>
    </div>
  );
}
