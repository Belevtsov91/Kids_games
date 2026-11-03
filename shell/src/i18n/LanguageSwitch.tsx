import { useI18n } from './I18nProvider';
import { LOCALE_LABELS, LOCALE_NAMES, LOCALES } from './locale';

/** Переключатель языка: RU · UA · RO · EN. Выбор сразу применяется ко всему сайту и запоминается. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className={['lang-switch', className].filter(Boolean).join(' ')} role="group" aria-label={t.common.language}>
      <span className="lang-switch-icon" aria-hidden="true">🌐</span>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          title={LOCALE_NAMES[l]}
          aria-label={LOCALE_NAMES[l]}
          onClick={() => setLocale(l)}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
