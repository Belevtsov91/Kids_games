-- 008: админка владельца (отдельный сайт, /api/admin).
-- Вход владельца с кодом из приложения, журнал его действий, журналы писем, ошибок, неудачных входов
-- и фоновых задач, проверки здоровья, флаги сайта (обслуживание, объявление, выключенные игры),
-- заморозка и отложенное удаление аккаунта, вид устройства в сессии.
-- Как в 001: префикс ig_, RLS без политик, доступ только у сервера. Скрипт идемпотентный.

-- Владелец: почта из ADMIN_EMAILS, свой пароль (scrypt) и секрет TOTP (зашифрован ключом сервера).
create table if not exists public.ig_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and char_length(email) between 3 and 254),
  password_hash text not null,
  totp_secret text not null,
  totp_confirmed boolean not null default false,
  -- Последний принятый 30-секундный шаг кода: один код дважды не сработает.
  totp_last_step bigint not null default 0,
  failed smallint not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- Сессии админки: как ig_sessions, в cookie зашифрованный токен, здесь его SHA-256. Живут 8 часов.
create table if not exists public.ig_admin_sessions (
  token_hash text primary key check (char_length(token_hash) = 64),
  admin_id uuid not null references public.ig_admins (id) on delete cascade,
  device_hash text not null check (char_length(device_hash) = 64),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists ig_admin_sessions_expires_at_idx on public.ig_admin_sessions (expires_at);

-- Известные устройства владельца: вход с нового — письмо.
create table if not exists public.ig_admin_devices (
  admin_id uuid not null references public.ig_admins (id) on delete cascade,
  device_hash text not null check (char_length(device_hash) = 64),
  label text check (label is null or char_length(label) <= 120),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (admin_id, device_hash)
);

-- Журнал действий владельца: кто, когда, что, над чем, было и стало. Хранится год.
create table if not exists public.ig_admin_audit (
  id bigint generated always as identity primary key,
  admin_email text not null,
  action text not null check (char_length(action) between 1 and 60),
  target_type text check (target_type is null or char_length(target_type) <= 30),
  target_id text check (target_id is null or char_length(target_id) <= 80),
  before jsonb,
  after jsonb,
  ip text check (ip is null or char_length(ip) <= 64),
  created_at timestamptz not null default now()
);
create index if not exists ig_admin_audit_created_at_idx on public.ig_admin_audit (created_at desc);
create index if not exists ig_admin_audit_target_idx on public.ig_admin_audit (target_type, target_id);

-- Журнал писем: кому, какое, ушло или нет. Текст письма не храним (в нём бывают разовые ссылки).
create table if not exists public.ig_mail_log (
  id bigint generated always as identity primary key,
  to_email text not null check (char_length(to_email) <= 254),
  tag text not null check (char_length(tag) <= 40),
  subject text not null check (char_length(subject) <= 200),
  ok boolean not null,
  error text check (error is null or char_length(error) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists ig_mail_log_created_at_idx on public.ig_mail_log (created_at desc);

-- Ошибки игр из браузера и сбои сервера, сгруппированные по тексту (fingerprint = SHA-256 источника, места и текста).
create table if not exists public.ig_error_log (
  fingerprint text primary key check (char_length(fingerprint) = 64),
  source text not null check (source in ('client', 'server')),
  path text check (path is null or char_length(path) <= 120),
  message text not null check (char_length(message) <= 300),
  count integer not null default 1 check (count >= 1),
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists ig_error_log_last_at_idx on public.ig_error_log (last_at desc);

-- Неудачные входы родителей (успешные не пишем). Почта — как ввели, обрезанная.
create table if not exists public.ig_login_failures (
  id bigint generated always as identity primary key,
  email text not null check (char_length(email) <= 254),
  known boolean not null,
  ip text check (ip is null or char_length(ip) <= 64),
  created_at timestamptz not null default now()
);
create index if not exists ig_login_failures_created_at_idx on public.ig_login_failures (created_at desc);

-- Запуски фоновых задач: отчёт за неделю, чистка, проверка здоровья, утренняя сводка.
create table if not exists public.ig_job_runs (
  id bigint generated always as identity primary key,
  job text not null check (char_length(job) <= 40),
  ok boolean not null,
  note text check (note is null or char_length(note) <= 300),
  manual boolean not null default false,
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now()
);
create index if not exists ig_job_runs_job_idx on public.ig_job_runs (job, started_at desc);

-- Проверки здоровья раз в 5 минут: по ним считаем «лежит дольше 5 минут» и шлём тревогу.
create table if not exists public.ig_health_checks (
  id bigint generated always as identity primary key,
  ok boolean not null,
  details jsonb not null,
  alerted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ig_health_checks_created_at_idx on public.ig_health_checks (created_at desc);

-- Флаги сайта: maintenance, banner, disabled_games, admin_readonly. Значение — JSON.
create table if not exists public.ig_site_flags (
  key text primary key check (key ~ '^[a-z_]{1,40}$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- «Что нового»: записи, которые владелец правит из админки. Тексты на четырёх языках в JSON.
create table if not exists public.ig_news (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  titles jsonb not null,
  bodies jsonb not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ig_news_day_idx on public.ig_news (day desc);

-- Заморозка аккаунта (войти нельзя, данные на месте) и отложенное удаление: 7 дней на отмену.
alter table public.ig_parents add column if not exists frozen_at timestamptz;
alter table public.ig_parents add column if not exists delete_after timestamptz;
create index if not exists ig_parents_delete_after_idx on public.ig_parents (delete_after) where delete_after is not null;

-- Вид устройства сессии (phone, tablet, desktop) — для разбивки на главной админки. Определяется при входе.
alter table public.ig_sessions add column if not exists device text check (device is null or device in ('phone', 'tablet', 'desktop'));

-- В какой игре был последний «пульс» ребёнка: для списка «играют сейчас».
alter table public.ig_child_settings add column if not exists last_game text check (last_game is null or last_game ~ '^[a-z0-9-]{1,40}$');

-- Размер наших таблиц (только ig_*) и всей базы — для раздела «Здоровье». Вызывает только сервер.
create or replace function public.ig_admin_table_sizes()
returns table (name text, bytes bigint, row_estimate bigint)
language sql security definer set search_path = pg_catalog
as $$
  select c.relname::text, pg_total_relation_size(c.oid), greatest(c.reltuples, 0)::bigint
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'ig\_%'
  order by 2 desc;
$$;
create or replace function public.ig_admin_db_size()
returns bigint language sql security definer set search_path = pg_catalog
as $$ select pg_database_size(current_database()); $$;
revoke all on function public.ig_admin_table_sizes(), public.ig_admin_db_size() from public, anon, authenticated;

alter table public.ig_admins enable row level security;
alter table public.ig_admin_sessions enable row level security;
alter table public.ig_admin_devices enable row level security;
alter table public.ig_admin_audit enable row level security;
alter table public.ig_mail_log enable row level security;
alter table public.ig_error_log enable row level security;
alter table public.ig_login_failures enable row level security;
alter table public.ig_job_runs enable row level security;
alter table public.ig_health_checks enable row level security;
alter table public.ig_site_flags enable row level security;
alter table public.ig_news enable row level security;
alter table public.ig_admins force row level security;
alter table public.ig_admin_sessions force row level security;
alter table public.ig_admin_devices force row level security;
alter table public.ig_admin_audit force row level security;
alter table public.ig_mail_log force row level security;
alter table public.ig_error_log force row level security;
alter table public.ig_login_failures force row level security;
alter table public.ig_job_runs force row level security;
alter table public.ig_health_checks force row level security;
alter table public.ig_site_flags force row level security;
alter table public.ig_news force row level security;

revoke all on public.ig_admins, public.ig_admin_sessions, public.ig_admin_devices, public.ig_admin_audit,
  public.ig_mail_log, public.ig_error_log, public.ig_login_failures, public.ig_job_runs,
  public.ig_health_checks, public.ig_site_flags, public.ig_news from anon, authenticated;
