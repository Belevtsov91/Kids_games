import { useState } from 'react';
import { post } from '../api/client';
import type { Me } from '../api/types';
import { applyTheme, savedTheme, type Theme } from '../app/theme';
import { LANGS, useI18n, type Key } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { Card } from '../ui/parts';

// Настройки: тема, язык, защита входа и «выйти со всех устройств».

const THEMES: { id: Theme; key: Key }[] = [
  { id: 'system', key: 'prefs.system' },
  { id: 'light', key: 'prefs.light' },
  { id: 'dark', key: 'prefs.dark' },
];

export function PrefsPage({ me }: { me: Me }) {
  const { t, lang, setLang } = useI18n();
  const { run } = useFeedback();
  const [theme, setTheme] = useState<Theme>(savedTheme);
  const pick = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };
  return (
    <div className="g2">
      <Card title={t('prefs.look')}>
        <div className="col">
          <div className="row"><span>{t('prefs.theme')}</span>
            <div className="seg">{THEMES.map((x) => <button key={x.id} className={theme === x.id ? 'on' : ''} onClick={() => pick(x.id)}>{t(x.key)}</button>)}</div>
          </div>
          <div className="row"><label htmlFor="prefs-lang">{t('prefs.lang')}</label>
            <select className="inp" id="prefs-lang" value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}>
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>
          <p className="note">{t('prefs.timeNote', { tz: Intl.DateTimeFormat().resolvedOptions().timeZone })}</p>
        </div>
      </Card>
      <Card title={t('prefs.security')}>
        <dl className="kv">
          <dt>{t('email')}</dt><dd className="mono">{me.email}</dd>
          <dt>{t('prefs.login')}</dt><dd>{t('prefs.loginValue')}</dd>
          <dt>{t('prefs.session')}</dt><dd>{t('prefs.sessionValue')}</dd>
          <dt>{t('prefs.lock')}</dt><dd>{t('prefs.lockValue')}</dd>
          <dt>{t('prefs.newDevice')}</dt><dd>{t('prefs.newDeviceValue')}</dd>
        </dl>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => void run(() => post('/auth/logout-all')).then(() => location.reload())}>{t('prefs.logoutAll')}</button>
        </div>
        <p className="note" style={{ marginTop: 8 }}>{t('prefs.lostPhone')}</p>
      </Card>
    </div>
  );
}
