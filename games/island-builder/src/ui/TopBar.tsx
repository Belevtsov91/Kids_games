import { QUESTS } from '../game/quests';
import { SAVE_STATUS_TEXT, type SaveStatus } from '../app/useIslandSave';

// Верхняя панель: название, статус сохранения и круглые кнопки действий.

interface Props {
  status: SaveStatus;
  night: boolean;
  canUndo: boolean;
  questsOpen: boolean;
  questsDone: number;
  onUndo(): void;
  onToggleNight(): void;
  onToggleQuests(): void;
  onNewIsland(): void;
}

export function TopBar({ status, night, canUndo, questsOpen, questsDone, onUndo, onToggleNight, onToggleQuests, onNewIsland }: Props) {
  return (
    <header className="ib-top">
      <div className="ib-chip ib-title">
        <span className="ib-title-emoji">🏝️</span>
        <span className="ib-title-text">Остров-конструктор</span>
        <span className={`ib-status ib-status-${status}`} title={SAVE_STATUS_TEXT[status]}>
          {SAVE_STATUS_TEXT[status]}
        </span>
      </div>
      <div className="ib-actions">
        <button className="ib-round ib-undo" onClick={onUndo} disabled={!canUndo} aria-label="Отменить" title="Отменить">
          ↶
        </button>
        <button className="ib-round" onClick={onToggleNight} aria-label={night ? 'Сделать день' : 'Сделать ночь'} title={night ? 'День' : 'Ночь'}>
          {night ? '☀️' : '🌙'}
        </button>
        <button className={`ib-round${questsOpen ? ' ib-on' : ''}`} onClick={onToggleQuests} aria-label="Задания" title="Задания">
          🏆<span className="ib-badge">{questsDone}/{QUESTS.length}</span>
        </button>
        <button className="ib-round" onClick={onNewIsland} aria-label="Новый остров" title="Новый остров">
          🗺️
        </button>
      </div>
    </header>
  );
}
