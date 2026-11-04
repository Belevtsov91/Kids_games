import { useState } from 'react';
import { ASK_MINUTES, useKidStatus } from './KidStatus';
import { useKidText } from './text';

/** «Попросить ещё»: кнопки +5/+10/+15/+30 и что ответил взрослый. */
export function AskTime() {
  const { status, ask } = useKidStatus();
  const k = useKidText();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!status) return null;
  const request = status.request;
  const pending = request?.status === 'pending';

  const send = async (minutes: number) => {
    setBusy(true);
    setFailed(false);
    try {
      await ask(minutes);
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  return (
    <div className="kid-ask">
      <strong>{k.ask.title}</strong>
      <p>{k.ask.lead}</p>
      {request && (
        <p className={`kid-ask-state kid-ask-${request.status}`} role="status">
          {request.status === 'pending' ? k.ask.sent(request.minutes) : request.status === 'approved' ? k.ask.approved(request.minutes) : k.ask.denied}
        </p>
      )}
      {status.canAsk && !pending ? (
        <div className="kid-ask-options">
          {ASK_MINUTES.map((m) => (
            <button key={m} type="button" disabled={busy} onClick={() => void send(m)}>
              {k.ask.option(m)}
            </button>
          ))}
        </div>
      ) : (
        !pending && <p className="kid-ask-state">{k.ask.off}</p>
      )}
      {failed && <p className="form-error" role="alert">{k.ask.failed}</p>}
    </div>
  );
}
