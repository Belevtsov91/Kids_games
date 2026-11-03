import type { NewIslandKind } from '../app/useIslandActions';
import { tr } from '../i18n';

const KINDS: { kind: NewIslandKind; icon: string }[] = [
  { kind: 'random', icon: '🎲' },
  { kind: 'flat', icon: '🟩' },
  { kind: 'empty', icon: '🌊' },
];

/** Выбор нового острова. Клик мимо окна — закрыть. */
export function NewIslandDialog({ onPick, onClose }: { onPick(kind: NewIslandKind): void; onClose(): void }) {
  const t = tr();
  return (
    <div className="ib-modal" role="dialog" aria-modal="true" aria-label={t.newIsland} onClick={onClose}>
      <div className="ib-card ib-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{t.newIsland}</h2>
        <p>{t.newText}</p>
        <div className="ib-choices">
          {KINDS.map(({ kind, icon }, i) => (
            <button key={kind} className="ib-choice" onClick={() => onPick(kind)}>
              <span>{icon}</span>
              {t.newKinds[i]}
            </button>
          ))}
        </div>
        <button className="ib-cancel" onClick={onClose}>
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
