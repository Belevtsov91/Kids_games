// Фейковый /api/admin для разработки без бэкенда: `npm run dev:mock`.
// Данные выдуманы. Любой код 2FA подходит, кроме 000000 (проверка ошибки).
import { createServer } from 'node:http';

const PORT = 3999;
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const ago = (min) => new Date(Date.now() - min * 6e4).toISOString();
const later = (d) => new Date(Date.now() + d * 864e5).toISOString();
let authed = true;
const fail = (status, body) => ({ fail: [status, body] });
const flags = { maintenance: false, banner: {}, disabled_games: [], admin_readonly: false };
const news = [{ id: 'n1', day: day(3), titles: { ru: 'Новая игра «Пазлы»' }, bodies: { ru: 'Собирайте картинки из кусочков.' }, published: true }];

const GAMES = [
  ['puzzle', '🧩', 'Пазлы', 3, 8], ['math', '➕', 'Счёт', 5, 10], ['letters', '🔤', 'Буквы', 4, 7],
  ['memory', '🃏', 'Память', 4, 12], ['draw', '🎨', 'Рисовалка', 3, 15], ['chess', '♟️', 'Шахматы', 7, 15],
].map(([id, emoji, title, min, max], i) => ({
  id, emoji, title, kind: 'local', ages: { min, max }, skills: ['logic'], stickers: 6, hasServer: id === 'chess', serverOk: true,
  disabled: false, minutes: 900 - i * 120, players: 40 - i * 5, levels: 300 - i * 40, answers: 800 - i * 90, rightShare: 0.6 + i * 0.05,
  quit: i % 3 === 2 ? null : { level: i % 3 ? '' : String(3 + i), quit: 6 - i, share: 15 + i * 2 },
}));
const dropoff = (id) => {
  const seed = id.length;
  const levels = Array.from({ length: 8 }, (_, i) => ({ name: String(i + 1), reached: Math.max(1, 38 - i * (3 + seed % 3) - (i >= 3 ? 6 : 0)), quit: i === 3 ? 7 : (i + seed) % 3 }));
  return { players: 40, active: 12, quitBeforeFirst: 2, levels, worst: { level: '4', quit: 7, share: 18 } };
};
const names = ['Анна', 'Олег', 'Ирина', 'Mihai', 'Olena', 'Sarah', 'Дмитрий', 'Ana', 'Тарас', 'Елена', 'John', 'Мария'];
const FAMILIES = names.map((name, i) => ({
  id: uid(i + 1), name, email: `${name[0].toLowerCase()}***@gmail.com`, children: (i % 3) + 1, locale: ['ru', 'uk', 'ro', 'en'][i % 4],
  createdAt: ago(60 * 24 * (i * 9 + 2)), lastSeenAt: ago(i * 300), consent: i !== 5, frozen: i === 7, deleteAfter: i === 9 ? later(5) : null, pinLocked: i === 2,
}));
const child = (id, name, age) => ({
  id, name, age, avatar: '🦊', createdAt: ago(60 * 24 * 40), deletedAt: null, purgeAt: null, hasPhoto: true,
  settings: { limit_weekday: 60, limit_weekend: 90, quiet_from: '21:00', quiet_to: '07:30', break_every: 20, can_ask: true, day_plan: ['letters', 'math'], music_volume: 60 },
  access: [{ gameId: 'chess', allowed: false }],
  week: Array.from({ length: 7 }, (_, d) => ({ day: day(6 - d), games: [{ gameId: 'puzzle', minutes: 10 + d * 3 }, { gameId: 'math', minutes: 5 + (d % 3) * 4 }] })),
  stickers: 14, skills: [{ skill: 'счёт', total: 120, right: 96, recent: 0.82, level: 'mid' }],
  saves: [{ gameId: 'puzzle', kind: 'cloud', items: 1, bytes: 2400, updatedAt: ago(90) }, { gameId: 'math', kind: 'table', items: 37, table: 'ig_math_progress' }],
});
const family = (id) => {
  const row = FAMILIES.find((f) => f.id === id) ?? FAMILIES[0];
  return {
    parent: { id: row.id, name: row.name, email: row.email, createdAt: row.createdAt, lastSeenAt: row.lastSeenAt, consentAt: row.consent ? row.createdAt : null,
      policyVersion: row.consent ? '2026-10' : null, inactiveWarnedAt: null, frozenAt: row.frozen ? ago(600) : null, deleteAfter: row.deleteAfter },
    settings: { timezone: 'Europe/Chisinau', mailLocale: row.locale, weeklyReport: true, notifyRequests: true, onboarded: true, hasPin: true, pinLockedUntil: row.pinLocked ? later(0.01) : null, hasPhoto: false },
    sessions: 2, helpers: [{ id: 'h1', name: 'Бабушка', email: null, child_ids: null, last_used_at: ago(2000) }], requests: [],
    children: [child('c1', 'Миша', 6), { ...child('c2', 'Соня', 4), settings: { toddler: true }, saves: [] }].slice(0, row.children),
  };
};
const overview = (days) => ({
  days, today: day(0), totals: { families: 128, children: 211 },
  newFamilies: { value: 9, change: 29 }, activeToday: { value: 34, change: -8 }, minutesToday: { value: 512, change: 12 },
  minutesPeriod: { value: 3920, change: 5 }, activePeriod: { value: 88, change: 10 }, pendingRequests: 2,
  errors24h: { total: 5, fresh: 1 }, mail24h: { sent: 23, failed: 1 },
  series: Array.from({ length: Math.min(days, 30) }, (_, i) => ({ day: day(Math.min(days, 30) - 1 - i), minutes: 300 + ((i * 47) % 260), active: 20 + ((i * 7) % 18), families: i % 4 })),
  topGames: GAMES.slice(0, 5).map((g) => ({ id: g.id, title: `${g.emoji} ${g.title}`, minutes: g.minutes })),
  playingNow: { children: 3, games: [{ id: 'puzzle', title: '🧩 Пазлы', count: 2 }, { id: 'math', title: '➕ Счёт', count: 1 }] },
  languages: { ru: 61, uk: 30, ro: 24, en: 13 }, ages: { '3–5': 70, '6–8': 92, '9–12': 39, '13–15': 10 }, devices: { phone: 40, tablet: 31, desktop: 12 },
});
const health = () => ({
  at: new Date().toISOString(),
  checks: [['db', true, '42 ms'], ['migration', true, 'ok'], ['mail', true, 'Brevo ok'], ['games', true, '1/1'], ['env', false, 'TELEGRAM_CHAT_ID не задан'], ['job:weekly-report', true, 'в порядке, 5 ч назад'], ['job:cleanup', true, 'в порядке, 4 ч назад'], ['job:digest', false, 'ещё не запускалась']].map(([id, ok, note]) => ({ id, ok, note })),
  jobs: [{ job: 'weekly-report', ok: true, lastAt: ago(60 * 30), note: 'отправлено 12' }, { job: 'cleanup', ok: true, lastAt: ago(300), note: 'удалено 0' }, { job: 'digest', ok: false, lastAt: null, note: 'ещё не запускалась' }],
  tables: [['ig_events', 41e6, 210000], ['ig_cloud_saves', 9e6, 3200], ['ig_children', 2e6, 211]].map(([name, bytes, row_estimate]) => ({ name, bytes, row_estimate })),
  limits: { dbBytes: 61e6, dbLimit: 500e6, mailsToday: 23, mailsLimit: 300 },
});
const rows = {
  '/audit': Array.from({ length: 30 }, (_, i) => ({ created_at: ago(i * 50), action: ['family.pin.reset', 'child.update', 'site.banner'][i % 3], target_type: 'family', target_id: uid((i % 12) + 1), before: { name: 'Анна' }, after: { name: 'Аня' } })),
  '/mail': Array.from({ length: 25 }, (_, i) => ({ id: `m${i}`, created_at: ago(i * 70), to_email: `${names[i % 12][0].toLowerCase()}***@gmail.com`, tag: ['password-reset', 'weekly-report', 'time-request'][i % 3], ok: i % 9 !== 4 })),
  '/errors': Array.from({ length: 6 }, (_, i) => ({ fingerprint: `e${i}`, message: ['TypeError: x is undefined', 'fetch failed', 'Timeout 30000ms'][i % 3], source: i % 2 ? 'client' : 'server', path: '/play/puzzle', count: 12 - i, last_at: ago(i * 200), resolved_at: i > 3 ? ago(10) : null })),
  '/login-failures': Array.from({ length: 8 }, (_, i) => ({ created_at: ago(i * 400), email: 'o***@mail.ru', known: i % 2 === 0, ip: `85.12.4.${i}` })),
  '/job-runs': Array.from({ length: 10 }, (_, i) => ({ started_at: ago(i * 720), job: i % 2 ? 'cleanup' : 'weekly-report', ok: true, manual: i === 3, note: 'ok' })),
};
const retention = () => ({
  rules: { inactiveDays: 365, warnDays: 30, trashDays: 30 },
  inactive: [{ id: uid(4), name: 'Mihai', email: 'm***@gmail.com', idleDays: 351, warnedAt: ago(60 * 24), deleteAt: later(14) }],
  deleting: [{ id: uid(10), name: 'Елена', email: 'е***@gmail.com', deleteAfter: later(5) }],
  trash: [{ id: 'c9', parentId: uid(1), name: 'Петя', age: 7, avatar: '🐻', deletedAt: ago(60 * 24 * 3), purgeAt: later(27) }],
});

const routes = [
  ['GET', /^\/auth\/me$/, () => (authed ? { email: 'owner@example.com', expiresAt: later(0.3), readonly: flags.admin_readonly } : fail(401, { code: 'auth', error: 'auth' }))],
  ['POST', /^\/auth\/login$/, (b) => (b.code === '000000' ? fail(401, { code: 'wrong' }) : ((authed = true), {}))],
  ['POST', /^\/auth\/logout(-all)?$/, () => ((authed = false), {})],
  ['POST', /^\/auth\/setup$/, () => ({ secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/Console:owner?secret=JBSWY3DPEHPK3PXP&issuer=Console' })],
  ['GET', /^\/overview$/, (_, q) => overview(Number(q.get('days') ?? 7))],
  ['GET', /^\/health$/, health],
  ['GET', /^\/games$/, () => GAMES.map((g) => ({ ...g, disabled: flags.disabled_games.includes(g.id) }))],
  ['GET', /^\/games\/(\w+)\/dropoff$/, (_, __, m) => dropoff(m[1])],
  ['POST', /^\/games\/(\w+)\/(disable|enable)$/, (_, __, m) => ((flags.disabled_games = m[2] === 'disable' ? [...flags.disabled_games, m[1]] : flags.disabled_games.filter((x) => x !== m[1])), {})],
  ['GET', /^\/families$/, (_, q) => {
    const s = (q.get('q') ?? '').toLowerCase();
    const items = FAMILIES.filter((f) => !s || f.name.toLowerCase().includes(s) || f.id === s);
    return { total: items.length, page: 1, pageSize: 25, items };
  }],
  ['GET', /^\/families\/([\w-]+)\/email$/, () => ({ email: 'anna.parent@gmail.com' })],
  ['GET', /^\/families\/([\w-]+)$/, (_, __, m) => family(m[1])],
  ['GET', /^\/families\/[\w-]+\/children\/[\w-]+\/drawings$/, () => [{ id: 'd1', title: 'Кот', created_at: ago(500) }]],
  ['GET', /^\/families\/[\w-]+\/children\/[\w-]+\/(photo|drawings\/\w+)$/, () => ({ photo: PIXEL, image: PIXEL })],
  ['GET', /^\/(audit|mail|errors|login-failures|job-runs)$/, (_, q, m) => {
    const all = rows[`/${m[1]}`];
    const page = Number(q.get('page') ?? 1);
    return { total: all.length, page, pageSize: 20, items: all.slice((page - 1) * 20, page * 20) };
  }],
  ['GET', /^\/mail\/preview$/, (_, q) => ({ subject: `Письмо «${q.get('template')}» (${q.get('locale')})`, html: '<p>Здравствуйте! Это пример письма.</p>' })],
  ['GET', /^\/retention$/, retention],
  ['GET', /^\/site$/, () => flags],
  ['POST', /^\/site\/(maintenance|readonly)$/, (b, _, m) => ((flags[m[1] === 'readonly' ? 'admin_readonly' : 'maintenance'] = Boolean(b.on)), {})],
  ['PUT', /^\/site\/banner$/, (b) => ((flags.banner = b.banner ?? {}), {})],
  ['GET', /^\/news$/, () => news],
  ['POST', /^\/news$/, (b) => (news.unshift({ id: `n${Date.now()}`, day: day(0), ...b }), {})],
];
const PIXEL = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#9ad"/><circle cx="120" cy="80" r="40" fill="#fc6"/></svg>');

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  const path = url.pathname.replace(/^\/api\/admin/, '');
  let body = '';
  for await (const chunk of req) body += chunk;
  const parsed = body ? JSON.parse(body) : {};
  const route = routes.find(([m, re]) => m === req.method && re.test(path));
  let out = route ? route[2](parsed, url.searchParams, path.match(route[1])) : {};
  let status = 200;
  if (out?.fail) [status, out] = out.fail;
  if (url.searchParams.get('format') === 'csv') {
    res.writeHead(200, { 'content-type': 'text/csv' });
    return res.end('a,b\n1,2\n');
  }
  if (req.method !== 'GET' && parsed.code === '000000') [status, out] = [400, { code: 'code' }];
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(out));
}).listen(PORT, () => console.log(`mock admin api on :${PORT}`));
