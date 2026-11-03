import { useEffect, useRef, type ReactNode } from 'react';

/** Диалог кабинета на <dialog>: фокус внутри, Esc и клик по фону закрывают. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="pa-modal"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="pa-modal-card">
        <h2>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
