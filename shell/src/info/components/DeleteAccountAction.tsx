import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { DeleteAccountDialog } from '@/account/DeleteAccountDialog';

/** Блок на странице «Удалить аккаунт и данные»: вошедшему — кнопка удаления, гостю — ссылка на вход. */
export function DeleteAccountAction() {
  const { me } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (!me) {
    return (
      <div className="info-delete">
        <p>{t.account.mustLogin}</p>
        <Link to="/login" className="btn btn-secondary">{t.common.login}</Link>
      </div>
    );
  }

  return (
    <div className="info-delete">
      <p>{t.account.loggedAs} <b>{me.parent.name}</b>. {t.account.beforeDelete}</p>
      <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}>
        {t.account.deleteSelf}
      </button>
      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
