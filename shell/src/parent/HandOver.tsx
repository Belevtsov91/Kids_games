import { useAuth } from '@/auth/AuthContext';
import { Face } from './ui/Face';
import { Modal } from './ui/Modal';
import { useParentText } from './text';

/** «Отдать ребёнку»: выбрать, кто играет, закрыть кабинет и открыть его миры. */
export function HandOver({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const p = useParentText();
  const { me, selectChild } = useAuth();
  const pick = async (id: string) => {
    await selectChild(id);
    await onDone();
  };
  return (
    <Modal title={p.bar.handTitle} onClose={onClose}>
      <p>{p.bar.handLead}</p>
      <div className="pa-pick">
        {me?.children.map((c) => (
          <button key={c.id} type="button" className="pa-pick-row" onClick={() => void pick(c.id)}>
            <Face photo={c.photo} avatar={c.avatar} size={44} />
            <b>{c.name}</b>
            <span aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
