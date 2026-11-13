import type { ChildDetail } from '../api';
import { useParentText } from '../text';
import { Panel, ToggleRow } from '../ui/bits';

/**
 * Защита профиля: вход только со взрослым (чтобы младший не играл без лимита под именем старшего)
 * и выход только со взрослым (личный планшет ребёнка).
 */
export function ProfileGuard({ child, save }: { child: ChildDetail; save: (patch: Record<string, unknown>) => Promise<boolean> }) {
  const g = useParentText().guard;
  const r = child.rules;
  // С правилами времени сервер и так не выпускает из профиля без взрослого.
  const hasRules = r.limitWeekday !== null || r.limitWeekend !== null || Boolean(r.limitDays?.some((m) => m > 0)) || Boolean(r.quietFrom && r.quietTo);
  return (
    <Panel title={g.title} lead={g.lead}>
      <ToggleRow id="kid-locked" label={g.locked} hint={g.lockedLead} checked={child.locked} onChange={(locked) => void save({ locked })} />
      <ToggleRow id="kid-exit-lock" label={g.exit} hint={g.exitLead} checked={child.exitLock} onChange={(exitLock) => void save({ exitLock })} />
      {hasRules && !child.exitLock && <p className="pa-note">{g.rulesNote}</p>}
    </Panel>
  );
}
