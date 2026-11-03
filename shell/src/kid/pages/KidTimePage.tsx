import { AskTime } from '../AskTime';
import { useKidStatus } from '../KidStatus';
import { TimeRing } from '../TimeRing';
import { useKidText } from '../text';
import { KidFrame } from './KidFrame';

/** «Моё время» (/me/time): сколько осталось сегодня, правила взрослого и просьба о времени. */
export function KidTimePage() {
  const { status } = useKidStatus();
  const k = useKidText();
  const time = status?.time;
  const rules = status?.rules;
  const limitText = (m: number | null) => (m === null ? k.timer.unlimited : k.hm(m));
  const hasRules = rules && (rules.limitWeekday !== null || rules.limitWeekend !== null || rules.quietFrom);

  return (
    <KidFrame back={{ to: '/me', label: k.me.toMe }}>
      <h1 className="kid-title">{k.me.tiles.time.title}</h1>
      <div className="kid-cols">
        <section className="kid-card kid-time-card">
          {time && <TimeRing time={time} size={190} />}
          {time && (
            <p className="kid-time-text">
              <strong>
                {time.blocked === 'quiet'
                  ? k.timer.quiet
                  : time.remaining === null
                    ? k.me.noLimit
                    : time.blocked
                      ? k.timer.over
                      : `${k.timer.label}: ${k.hm(time.remaining)}`}
              </strong>
              <span>{k.me.played(k.hm(time.usedMinutes))}</span>
            </p>
          )}
        </section>
        <div className="kid-stack">
          {time?.limit !== null && time && (
            <section className="kid-card">
              <AskTime />
            </section>
          )}
          <section className="kid-card">
            <h2>{k.me.rules}</h2>
            {hasRules ? (
              <ul className="kid-rules">
                {(rules.limitWeekday !== null || rules.limitWeekend !== null) && (
                  <li>⏳ {k.me.limitInfo(limitText(rules.limitWeekday), limitText(rules.limitWeekend))}</li>
                )}
                {rules.quietFrom && rules.quietTo && <li>🌙 {k.me.quietInfo(rules.quietFrom, rules.quietTo)}</li>}
                {rules.breakEvery > 0 && <li>🙆 {k.pause.title} · {k.hm(rules.breakEvery)}</li>}
              </ul>
            ) : (
              <p>{k.me.noRules}</p>
            )}
          </section>
        </div>
      </div>
    </KidFrame>
  );
}
