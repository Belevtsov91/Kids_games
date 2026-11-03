import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { papi } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { Panel } from '../ui/bits';

/** Удаление профиля: впишите имя ребёнка — защита от случайного нажатия. */
export function DeleteChild({ id, name }: { id: string; name: string }) {
  const p = useParentText();
  const { toast } = useParent();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await papi.delete(`/children/${id}`);
      toast(p.profile.deleted(name));
      await refresh();
      navigate('/parent/kids');
    } catch {
      toast(p.failed);
      setBusy(false);
    }
  };

  return (
    <Panel title={p.profile.del} lead={p.profile.delLead} className="pa-danger">
      <label className="pa-field">
        <span>{p.profile.delConfirm(name)}</span>
        <input id="kid-delete-name" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </label>
      <button type="button" className="pa-btn pa-btn-danger" disabled={busy || typed.trim() !== name} onClick={() => void remove()}>
        {p.profile.delGo}
      </button>
    </Panel>
  );
}
