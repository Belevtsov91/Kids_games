import { useEffect, useState } from 'react';
import { papi } from '@/parent/api';
import { ParentGate } from '@/parent/gate/ParentGate';
import { useI18n } from '@/i18n/I18nProvider';

/**
 * Задача для взрослых поверх любой страницы ребёнка. Нужна, когда сервер ответил 423:
 * у текущего ребёнка есть правила времени (или оно кончилось), а профиль хотят сменить.
 * Задача даёт одну смену профиля и не открывает кабинет. После неё зовёт onUnlocked.
 */
export function AdultOverlay({ reason, onUnlocked, onClose }: { reason: 'limit' | 'quiet' | 'rules'; onUnlocked: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const l = t.children.locked;
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    papi.raw.get<{ hasPin: boolean }>('/status').then((s) => setHasPin(s.hasPin), () => setHasPin(false));
  }, []);

  return (
    <div className="adult-overlay dash pa pa-locked" role="dialog" aria-modal="true">
      {!asking ? (
        <div className="adult-ask">
          <span className="adult-ask-icon" aria-hidden="true">{reason === 'quiet' ? '🌙' : reason === 'rules' ? '🔒' : '⏰'}</span>
          <p>{l[reason]}</p>
          <div className="adult-ask-actions">
            <button type="button" className="dash-btn" onClick={onClose}>{l.back}</button>
            <button type="button" className="dash-btn dash-btn-primary" disabled={hasPin === null} onClick={() => setAsking(true)}>
              {l.adult}
            </button>
          </div>
        </div>
      ) : (
        hasPin !== null && <ParentGate hasPin={hasPin} purpose="switch" onUnlocked={onUnlocked} />
      )}
    </div>
  );
}
