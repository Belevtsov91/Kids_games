import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { papi } from '@/parent/api';
import { ParentGate } from '@/parent/gate/ParentGate';
import { useI18n } from '@/i18n/I18nProvider';

/** Почему нужен взрослый: правила времени, замки профиля или новый профиль. */
export type AdultReason = 'limit' | 'quiet' | 'rules' | 'exit' | 'locked' | 'create';
const REASONS: readonly AdultReason[] = ['limit', 'quiet', 'rules', 'exit', 'locked', 'create'];
const ICONS: Record<AdultReason, string> = { limit: '⏰', quiet: '🌙', rules: '🔒', exit: '🔒', locked: '🔒', create: '👨‍👩‍👧' };

/** Ответ сервера 423 при смене или создании профиля → причина; любая другая ошибка → null. */
export function adultReason(err: unknown): AdultReason | null {
  if (!(err instanceof ApiError) || err.status !== 423) return null;
  const reason = err.data?.reason as AdultReason;
  return REASONS.includes(reason) ? reason : 'limit';
}

/**
 * Задача для взрослых поверх любой страницы ребёнка. Нужна, когда сервер ответил 423: у текущего ребёнка
 * есть правила времени или замок на выход, выбирают защищённый профиль или создают новый.
 * Задача даёт одно такое действие и не открывает кабинет. После неё зовёт onUnlocked.
 */
export function AdultOverlay({ reason, onUnlocked, onClose }: { reason: AdultReason; onUnlocked: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const l = t.children.locked;
  const [gate, setGate] = useState<{ hasPin: boolean; needPassword: boolean } | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    papi.raw.get<{ hasPin: boolean; needPassword?: boolean }>('/status').then(
      (s) => setGate({ hasPin: s.hasPin, needPassword: Boolean(s.needPassword) }),
      () => setGate({ hasPin: false, needPassword: false }),
    );
  }, []);

  return (
    <div className="adult-overlay dash pa pa-locked" role="dialog" aria-modal="true">
      {!asking ? (
        <div className="adult-ask">
          <span className="adult-ask-icon" aria-hidden="true">{ICONS[reason]}</span>
          <p>{l[reason]}</p>
          <div className="adult-ask-actions">
            <button type="button" className="dash-btn" onClick={onClose}>{l.back}</button>
            <button type="button" className="dash-btn dash-btn-primary" disabled={!gate} onClick={() => setAsking(true)}>
              {l.adult}
            </button>
          </div>
        </div>
      ) : (
        gate && <ParentGate hasPin={gate.hasPin} needPassword={gate.needPassword} purpose="switch" onUnlocked={onUnlocked} />
      )}
    </div>
  );
}
