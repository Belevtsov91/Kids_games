import { useAuthText } from '../text';
import { passRules, passScore, type PassRules } from '../validation';

const COLORS = ['', '#ff5c7a', '#ff9f43', '#ffd25a', '#7ef09a'];

/** Полоски надёжности и список правил под полем нового пароля. */
export function PasswordMeter({ value }: { value: string }) {
  const text = useAuthText();
  const score = passScore(value);
  const rules = passRules(value);
  return (
    <div className="au-meter-box" aria-live="polite">
      <div className="au-meter" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < score ? 'is-on' : ''} style={i < score ? { background: COLORS[score] } : undefined} />
        ))}
      </div>
      <div className="au-strength">
        <span>{text.strength}</span>
        <span style={value ? { color: COLORS[score] } : undefined}>{value ? text.levels[score] : '—'}</span>
      </div>
      <ul className="au-rules">
        {(Object.keys(text.rules) as (keyof PassRules)[]).map((k) => (
          <li key={k} className={rules[k] ? 'is-ok' : ''}>
            {text.rules[k]}
          </li>
        ))}
      </ul>
    </div>
  );
}
