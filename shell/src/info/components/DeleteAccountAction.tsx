import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';

/**
 * Блок на странице «Удалить аккаунт и данные». Само удаление — только в кабинете родителя
 * (задача для взрослых, PIN и пароль): страницу документов может открыть и ребёнок.
 */
export function DeleteAccountAction() {
  const { me } = useAuth();
  const { t } = useI18n();

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
      <p>{t.account.loggedAs} <b>{me.parent.name}</b>. {t.account.inCabinet}</p>
      <Link to="/parent/account/data" className="btn btn-secondary">{t.account.goCabinet}</Link>
    </div>
  );
}
