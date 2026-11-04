import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { useI18n } from '@/i18n/I18nProvider';
import { allCorrect, makeProblems } from './parentCheck';

/** Удаление аккаунта: сначала три примера (проверка, что это взрослый), потом подтверждение. */
export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { me, deleteAccount } = useAuth();
  const { t } = useI18n();
  const a = t.account;
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [problems, setProblems] = useState(makeProblems);
  const [answers, setAnswers] = useState(['', '', '']);
  const [step, setStep] = useState<'check' | 'confirm'>('check');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');

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
    setError(a.wrong);
  };

  const remove = async () => {
    if (!password) return setError(a.passwordWrong);
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError && err.data?.code === 'password' ? a.passwordWrong : a.failed);
      setBusy(false);
    }
  };

  const kids = me?.children.length ?? 0;

  return (
    <dialog ref={dialogRef} className="account-dialog" onCancel={onClose} aria-labelledby="delete-title">
      <h2 id="delete-title">{a.title}</h2>

      {step === 'check' ? (
        <form onSubmit={check}>
          <p>{a.adultsOnly}</p>
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
                  onChange={(e) => setAnswers((v) => v.map((x, k) => (k === i ? e.target.value : x)))}
                  aria-label={a.answer(p.text)}
                />
              </label>
            ))}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="account-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t.common.cancel}</button>
            <button className="btn btn-primary">{a.check}</button>
          </div>
        </form>
      ) : (
        <div>
          <p>{a.cannotUndo}</p>
          <ul className="account-loss">
            <li>{a.lossAdult}</li>
            <li>{kids > 0 ? a.lossKids(kids) : a.lossSaves}</li>
            <li>{a.lossDevices}</li>
          </ul>
          <label className="parent-problem">
            <span>{a.password}</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="account-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>{a.keep}</button>
            <button type="button" className="btn btn-danger" onClick={() => void remove()} disabled={busy}>
              {busy ? a.deleting : a.forever}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
