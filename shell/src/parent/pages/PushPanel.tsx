import { useEffect, useState } from 'react';
import { useParent } from '../ParentShell';
import { disablePush, enablePush, pushState, type PushState } from '../push';
import { useParentText } from '../text';
import { ToggleRow } from '../ui/bits';

/** Переключатель push на этом устройстве (в «Просьбах и письмах»). */
export function PushRow() {
  const p = useParentText();
  const b = p.inbox;
  const { toast } = useParent();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    pushState().then((s) => live && setState(s), () => live && setState('unsupported'));
    return () => {
      live = false;
    };
  }, []);

  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      const next = on ? await enablePush() : await disablePush();
      setState(next);
      if (next === (on ? 'on' : 'off')) toast(p.saved);
    } catch {
      toast(p.failed);
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;
  const note = state === 'on' || state === 'off' ? null : b.pushState[state];
  return (
    <>
      <ToggleRow id="push-requests" label={b.push} hint={b.pushLead} checked={state === 'on'} disabled={busy || note !== null} onChange={(v) => void toggle(v)} />
      {note && <p className="pa-note">{note}</p>}
    </>
  );
}
