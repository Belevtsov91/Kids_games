import type { FastifyBaseLogger } from 'fastify';
import type { GameManifest } from '@ig/sdk/manifest';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { simpleMail } from '../../mail/layout.js';
import { mailEnabled, sendMail } from '../../mail/mailer.js';
import { MAIL_TEXT, mailLang, type MailLang } from '../../mail/texts.js';
import { statsOf } from '../kid/childData.js';
import { localNow } from '../kid/timeRules.js';
import { summarizeSkills } from '../progress/skills.js';
import { eventsOf } from '../parent/progress.routes.js';

// Отчёт за неделю: по воскресеньям после 18:00 по времени семьи, раз в неделю, тем, кто включил.
// Проверка раз в час; сервер может перезапускаться — report_sent_on не даст отправить дважды.

const HOUR = 60 * 60 * 1000;
const hm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

/** Пора ли слать отчёт: воскресенье, 18:00 и позже, сегодня ещё не слали. */
export const reportDue = (local: { day: string; weekday: number; minutes: number }, sentOn: string | null) =>
  local.weekday === 0 && local.minutes >= 18 * 60 && sentOn !== local.day;

async function childRows(childId: string, name: string, zone: string, lang: MailLang, titles: Map<string, GameManifest>) {
  const t = MAIL_TEXT[lang].weekly;
  const [stats, events, { count: stickers }] = await Promise.all([
    statsOf(childId, zone, 7),
    eventsOf(childId, 7),
    db().from('ig_stickers').select('sticker', { count: 'exact', head: true }).eq('child_id', childId).gte('earned_at', new Date(Date.now() - 7 * 86_400_000).toISOString()),
  ]);
  const total = stats.days.reduce((s, d) => s + d.minutes, 0);
  const fav = [...stats.games].sort((a, b) => b.minutes - a.minutes)[0];
  const game = fav && titles.get(fav.gameId);
  const good = summarizeSkills(events).filter((s) => s.level === 'good').length;
  return [
    [`${name} · ${t.played}`, hm(total)],
    [t.favorite, game ? `${game.emoji} ${game.titles?.[lang] ?? game.title}` : t.none],
    [t.learned, String(good)],
    [t.stickers, String(stickers ?? 0)],
  ] as [string, string][];
}

export async function sendWeeklyReports(catalog: GameManifest[], log: FastifyBaseLogger, now = new Date()) {
  const { data: parents, error } = await db().from('ig_parent_settings').select('parent_id, timezone, mail_locale, report_sent_on').eq('weekly_report', true);
  if (error) throw error;
  const titles = new Map(catalog.map((g) => [g.id, g]));
  for (const p of parents ?? []) {
    const zone = p.timezone ?? 'UTC';
    const local = localNow(now, zone);
    if (!reportDue(local, p.report_sent_on)) continue;
    const lang = mailLang(p.mail_locale);
    const t = MAIL_TEXT[lang];
    const [{ data: parent }, { data: kids }] = await Promise.all([
      db().from('ig_parents').select('email').eq('id', p.parent_id).single(),
      db().from('ig_children').select('id, name').eq('parent_id', p.parent_id).order('created_at'),
    ]);
    if (!parent || !kids?.length) continue;
    const rows = (await Promise.all(kids.map((k) => childRows(k.id, k.name, zone, lang, titles)))).flat();
    const tip = t.weekly.tips[Number(local.day.slice(8, 10)) % t.weekly.tips.length];
    const mail = simpleMail({
      locale: lang,
      subject: t.weekly.subject,
      title: t.weekly.title,
      lines: [t.weekly.lead],
      rows,
      buttons: [{ label: t.weekly.open, url: `${env.appUrl}/parent` }],
      footer: `${tip} · ${t.weekly.off}`,
    });
    if (mailEnabled) await sendMail({ to: parent.email, ...mail });
    else log.info({ parentId: p.parent_id }, 'Почта не настроена: отчёт за неделю не отправлен');
    await db().from('ig_parent_settings').update({ report_sent_on: local.day }).eq('parent_id', p.parent_id);
  }
}

/** Запускает проверку раз в час. Возвращает функцию остановки. */
export function startWeeklyReports(catalog: GameManifest[], log: FastifyBaseLogger) {
  const run = () => void sendWeeklyReports(catalog, log).catch((err) => log.error({ err }, 'Отчёт за неделю не отправлен'));
  const id = setInterval(run, HOUR);
  setTimeout(run, 60_000);
  return () => clearInterval(id);
}
