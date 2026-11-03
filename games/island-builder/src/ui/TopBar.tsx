import { QUESTS } from '../game/quests';
import type { SaveStatus } from '../app/useIslandSave';
import { tr } from '../i18n';

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
        <span className="ib-title-text">{tr().title}</span>
        <span className={`ib-status ib-status-${status}`} title={tr().status[status]}>
          {tr().status[status]}
        </span>
      </div>
      <div className="ib-actions">
        <button className="ib-round ib-undo" onClick={onUndo} disabled={!canUndo} aria-label={tr().undo} title={tr().undo}>
          ↶
        </button>
        <button className="ib-round" onClick={onToggleNight} aria-label={night ? tr().makeDay : tr().makeNight} title={night ? tr().day : tr().night}>
          {night ? '☀️' : '🌙'}
        </button>
        <button className={`ib-round${questsOpen ? ' ib-on' : ''}`} onClick={onToggleQuests} aria-label={tr().quests} title={tr().quests}>
          🏆<span className="ib-badge">{questsDone}/{QUESTS.length}</span>
        </button>
        <button className="ib-round" onClick={onNewIsland} aria-label={tr().newIsland} title={tr().newIsland}>
          🗺️
        </button>
      </div>
    </header>
  );
}
