import { useState } from 'react';
import { get, qs, TZ } from '../api/client';
import type { Overview } from '../api/types';
import { useLoad } from '../app/useLoad';
import { useI18n, type Key } from '../i18n';
import { Bars, Card, HBars, Kpi, LoadState, shortDay } from '../ui/parts';

// Главная: цифры за период со сравнением, графики по дням, кто играет сейчас, разбивки.

const PERIODS: { days: number; key: Key }[] = [
  { days: 1, key: 'period.1' },
  { days: 7, key: 'period.7' },
  { days: 30, key: 'period.30' },
  { days: 365, key: 'period.365' },
];
const LANG_NAMES: Record<string, string> = { ru: 'Русский', uk: 'Українська', ro: 'Română', en: 'English' };
const DEVICE_KEYS: Record<string, Key> = { phone: 'device.phone', tablet: 'device.tablet', desktop: 'device.desktop' };

const share = (map: Record<string, number>, label: (k: string) => string) => {
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: label(k), value: v, text: `${v} · ${Math.round((v / total) * 100)}%` }));
};

export function HomePage() {
  const { t } = useI18n();
  const [days, setDays] = useState(7);
  const state = useLoad(() => get<Overview>(`/overview${qs({ days, tz: TZ })}`), [days]);
  const o = state.data;

  return (
    <>
      <div className="row">
        <div className="seg">
          {PERIODS.map((p) => <button key={p.days} className={days === p.days ? 'on' : ''} onClick={() => setDays(p.days)}>{t(p.key)}</button>)}
        </div>
        <span className="sp" />
        <span className="note">{t('autoRefresh')}</span>
      </div>
      <LoadState state={state} />
      {o && (
        <>
          <div className="grid">
            <Kpi title={t('home.families')} value={o.totals.families} note={t('home.newInPeriod', { n: o.newFamilies.value })} delta={o.newFamilies} />
            <Kpi title={t('home.children')} value={o.totals.children} />
            <Kpi title={t('home.activeToday')} value={o.activeToday.value} delta={o.activeToday} />
            <Kpi title={t('home.minutesToday')} value={o.minutesToday.value} delta={o.minutesToday} />
            <Kpi title={t('home.minutesPeriod')} value={o.minutesPeriod.value} delta={o.minutesPeriod} />
            <Kpi title={t('home.requests')} value={o.pendingRequests} note={t('home.requestsNote')} />
            <Kpi title={t('home.errors')} value={o.errors24h.total} note={t('home.errorsNew', { n: o.errors24h.fresh })} tone={o.errors24h.fresh ? 'bad' : undefined} />
            <Kpi title={t('home.mail')} value={o.mail24h.sent} note={t('home.mailFailed', { n: o.mail24h.failed })} tone={o.mail24h.failed ? 'bad' : undefined} />
          </div>
          <div className="g2">
            <Card title={t('home.minutesChart')}><Bars values={o.series.map((s) => s.minutes)} labels={o.series.map((s) => shortDay(s.day))} /></Card>
            <Card title={t('home.activeChart')}><Bars values={o.series.map((s) => s.active)} labels={o.series.map((s) => shortDay(s.day))} /></Card>
            <Card title={t('home.familiesChart')}><Bars values={o.series.map((s) => s.families)} labels={o.series.map((s) => shortDay(s.day))} /></Card>
            <Card title={t('home.playingNow', { n: o.playingNow.children })}>
              <HBars rows={o.playingNow.games.map((g) => ({ label: g.title ?? t('home.unknownGame'), value: g.count }))} empty={t('home.nobody')} />
            </Card>
            <Card title={t('home.topGames')}><HBars rows={o.topGames.map((g) => ({ label: g.title, value: g.minutes }))} empty={t('empty')} /></Card>
            <Card title={t('home.languages')}><HBars rows={share(o.languages, (k) => LANG_NAMES[k] ?? k)} empty={t('empty')} /></Card>
            <Card title={t('home.ages')}><HBars rows={share(o.ages, (k) => k)} empty={t('empty')} /></Card>
            <Card title={t('home.devices')}><HBars rows={share(o.devices, (k) => (DEVICE_KEYS[k] ? t(DEVICE_KEYS[k]) : k))} empty={t('home.devicesEmpty')} /></Card>
          </div>
        </>
      )}
    </>
  );
}
