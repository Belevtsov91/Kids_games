import { useI18n } from '@/i18n/I18nProvider';
import { useParentText } from '../text';
import { RIDDLES } from '../text/riddles';

export type Challenge =
  | { kind: 'seq'; numbers: number[] }
  | { kind: 'mul'; a: number; b: number; c: number }
  | { kind: 'riddle'; index: number };

/** Условие задачи на языке сайта. Ответа на клиенте нет. */
export function ChallengeView({ challenge }: { challenge: Challenge }) {
  const p = useParentText();
  const { locale } = useI18n();
  return (
    <div className="gate-puzzle" data-testid="gate-puzzle">
      <span className="gate-kind">{p.gate.kinds[challenge.kind]}</span>
      {challenge.kind === 'seq' && (
        <>
          <p className="gate-q">{p.gate.seqQ}</p>
          <div className="gate-seq">
            {challenge.numbers.map((n, i) => (
              <span key={i}>{n}</span>
            ))}
            <span className="gate-qm">?</span>
          </div>
        </>
      )}
      {challenge.kind === 'mul' && (
        <>
          <p className="gate-q">{p.gate.mulQ}</p>
          <div className="gate-seq gate-expr">
            <span>{challenge.a}</span>×<span>{challenge.b}</span>+<span>{challenge.c}</span>=<span className="gate-qm">?</span>
          </div>
        </>
      )}
      {challenge.kind === 'riddle' && <p className="gate-q">{RIDDLES[locale][challenge.index]}</p>}
    </div>
  );
}
