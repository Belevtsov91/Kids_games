import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { allCorrect, makeProblems } from './parentCheck';

/** Удаление аккаунта: сначала три примера (проверка, что это взрослый), потом подтверждение. */
export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { me, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [problems, setProblems] = useState(makeProblems);
  const [answers, setAnswers] = useState(['', '', '']);
  const [step, setStep] = useState<'check' | 'confirm'>('check');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  const check = (e: FormEvent) => {
    e.preventDefault();
    if (allCorrect(problems, answers)) {
      setError(null);
      setStep('confirm');
      return;
    }
    // при ошибке — новые примеры, чтобы ответ нельзя было подобрать
    setProblems(makeProblems());
    setAnswers(['', '', '']);
    setError('Есть ошибка. Вот новые примеры.');
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось удалить. Попробуйте ещё раз.');
      setBusy(false);
    }
  };

  const kids = me?.children.length ?? 0;

  return (
    <dialog ref={dialogRef} className="account-dialog" onCancel={onClose} aria-labelledby="delete-title">
      <h2 id="delete-title">Удалить аккаунт</h2>

      {step === 'check' ? (
        <form onSubmit={check}>
          <p>Это может сделать только взрослый. Решите три примера.</p>
          <div className="parent-check">
            {problems.map((p, i) => (
              <label key={p.text} className="parent-problem">
                <span>{p.text} =</span>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  value={answers[i]}
                  autoFocus={i === 0}
                  onChange={(e) => setAnswers((a) => a.map((v, k) => (k === i ? e.target.value : v)))}
                  aria-label={`Ответ: ${p.text}`}
                />
              </label>
            ))}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="account-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button className="btn btn-primary">Проверить</button>
          </div>
        </form>
      ) : (
        <div>
          <p>Удаление нельзя отменить. Вместе с аккаунтом пропадут:</p>
          <ul className="account-loss">
            <li>почта, имя и пароль взрослого;</li>
            <li>{kids > 0 ? `профили детей (${kids}) и все их сохранения во всех играх;` : 'все сохранения во всех играх;'}</li>
            <li>вход на всех устройствах.</li>
          </ul>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="account-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Оставить аккаунт</button>
            <button type="button" className="btn btn-danger" onClick={() => void remove()} disabled={busy}>
              {busy ? 'Удаляем…' : 'Удалить навсегда'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
