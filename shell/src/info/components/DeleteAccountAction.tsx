import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { DeleteAccountDialog } from '@/account/DeleteAccountDialog';

/** Блок на странице «Удалить аккаунт и данные»: вошедшему — кнопка удаления, гостю — ссылка на вход. */
export function DeleteAccountAction() {
  const { me } = useAuth();
  const [open, setOpen] = useState(false);

  if (!me) {
    return (
      <div className="info-delete">
        <p>Чтобы удалить аккаунт, сначала войдите в него.</p>
        <Link to="/login" className="btn btn-secondary">Войти</Link>
      </div>
    );
  }

  return (
    <div className="info-delete">
      <p>Вы вошли как <b>{me.parent.name}</b>. Перед удалением попросим решить три примера.</p>
      <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}>
        Удалить самостоятельно
      </button>
      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
