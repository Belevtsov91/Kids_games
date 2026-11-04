import { Link } from 'react-router';
import { findGame } from '@/catalog/catalog';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { age as ageText } from '@/i18n/plural';
import { LOCALE_NAMES, type Locale } from '@/i18n/locale';
import { TimeRing } from '@/kid/TimeRing';
import type { ChildCard } from '../api';
import { useParentText } from '../text';
import { Face } from './Face';

/** Карточка ребёнка в обзоре: состояние, кольцо времени, последняя игра. Ведёт на страницу ребёнка. */
export function KidCard({ child }: { child: ChildCard }) {
  const p = useParentText();
  const { locale } = useI18n();
  const o = p.overview;
  const t = child.time;
  const state = t.blocked === 'quiet' ? ['quiet', o.quiet] : t.blocked === 'limit' ? ['limit', o.limitOver] : child.playingNow ? ['play', o.playing] : ['idle', o.idle];
  const last = child.lastGame && findGame(child.lastGame);
  return (
    <Link to={`/parent/kids/${child.id}`} className="pa-kid" data-testid="parent-kid">
      <div className="pa-kid-top">
        <Face photo={child.photo} avatar={child.avatar} size={56} />
        <div>
          <b>{child.name}</b>
          <span>
            {ageText(locale, child.age)}
            {child.lang && ` · ${LOCALE_NAMES[child.lang as Locale] ?? child.lang}`}
          </span>
        </div>
      </div>
      <span className={`pa-state pa-state-${state[0]}`}>{state[1]}</span>
      <div className="pa-kid-mid">
        <TimeRing time={t} size={78} />
        <dl>
          <dt>{o.today}</dt>
          <dd>{t.limit === null ? `${p.hm(t.usedMinutes)}, ${o.noLimit}` : o.of(p.hm(t.usedMinutes), p.hm(t.limit))}</dd>
          <dt>{o.last}</dt>
          <dd>{last ? gameTitle(last, locale) : o.nothing}</dd>
        </dl>
      </div>
    </Link>
  );
}
