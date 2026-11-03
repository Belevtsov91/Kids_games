import { games } from '@/catalog/catalog';
import { useI18n } from '@/i18n/I18nProvider';
import { age as ageText } from '@/i18n/plural';
import { LOCALE_NAMES, type Locale } from '@/i18n/locale';
import { TimeRing } from '@/kid/TimeRing';
import { useParentText } from '../text';
import { DayBars } from '../ui/DayBars';
import { Face } from '../ui/Face';
import { PageHead, Panel, Tile } from '../ui/bits';
import { useChild } from './useChild';
import { allowedGames } from './access';

/** Страница ребёнка: шапка и плитки-ссылки на отдельные страницы настроек и аналитики. */
export function ChildHubPage() {
  const p = useParentText();
  const { locale } = useI18n();
  const { id, child, missing } = useChild();
  if (missing) return <PageHead title={p.child.notFound} back={{ to: '/parent/kids', label: p.nav.kids }} />;
  if (!child) return null;
  const t = child.time;
  const base = `/parent/kids/${id}`;
  const lang = child.lang ? LOCALE_NAMES[child.lang as Locale] : p.profile.langSite;
  const open = allowedGames(child).length;

  return (
    <>
      <div className="pa-child-head">
        <Face photo={child.photo} avatar={child.avatar} size={96} />
        <PageHead
          eyebrow={p.child.eyebrow}
          title={`${child.name}, ${ageText(locale, child.age)}`}
          lead={`${lang} · ${p.child.gamesOpen(open, games.length)}`}
        />
        <div className="pa-child-ring">
          <TimeRing time={t} size={96} />
          <span>{t.limit === null ? p.time.todayFree(p.hm(t.usedMinutes)) : p.time.today(p.hm(t.usedMinutes), p.hm(t.limit))}</span>
        </div>
      </div>

      <div className="pa-tiles">
        <Tile to={`${base}/profile`} icon="🪪" title={p.child.tiles.profile[0]} text={p.child.tiles.profile[1]} />
        <Tile to={`${base}/time`} icon="⏳" title={p.child.tiles.time[0]} text={p.child.tiles.time[1]} />
        <Tile to={`${base}/games`} icon="🎮" title={p.child.tiles.games[0]} text={p.child.tiles.games[1]} extra={<em>{open} / {games.length}</em>} />
        <Tile to={`${base}/stats`} icon="📊" title={p.child.tiles.stats[0]} text={p.child.tiles.stats[1]} />
      </div>

      <Panel title={p.overview.week} lead={p.overview.weekLead}>
        <DayBars days={child.week} dayNames={p.days} limit={child.rules.limitWeekday} />
      </Panel>
    </>
  );
}
