import { tr } from '../i18n';

const ICONS = ['👆', '🔄', '🤏', '🏆'];

/** Подсказка «как играть» для нового острова. */
export function WelcomeDialog({ onStart }: { onStart(): void }) {
  const t = tr();
  return (
    <div className="ib-modal" role="dialog" aria-modal="true" aria-label={t.howTo}>
      <div className="ib-card ib-dialog">
        <h2>{t.welcome}</h2>
        <ul className="ib-howto">
          {t.welcomeTips.map((tip, i) => (
            <li key={tip}>
              <span>{ICONS[i]}</span>
              {tip}
            </li>
          ))}
        </ul>
        <button className="ib-start" onClick={onStart}>
          {t.play}
        </button>
      </div>
    </div>
  );
}
