-- ===== platform/server/migrations/001_auth.sql =====
-- 001: родители, дети, серверные сессии игр.
-- База общая с другим проектом (KinderFlow), поэтому все таблицы игр с префиксом ig_
-- и свои аккаунты: auth.users и чужие таблицы не используются и не меняются.
-- Браузер к этим таблицам не ходит вообще: доступ только у сервера с секретным ключом.
-- RLS включён, политик нет, права у anon/authenticated отозваны — публичный ключ ничего не прочитает.

create table if not exists public.ig_parents (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and char_length(email) between 3 and 254),
  -- scrypt: "scrypt$N$r$p$соль$хеш", сам пароль нигде не хранится.
  password_hash text not null,
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.ig_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.ig_parents (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  age smallint not null check (age between 3 and 15),
  avatar text not null check (char_length(avatar) between 1 and 16),
  created_at timestamptz not null default now()
);
create index if not exists ig_children_parent_id_idx on public.ig_children (parent_id);

-- В cookie лежит зашифрованный случайный токен; здесь только его SHA-256.
-- Утечка таблицы не даёт войти: по хешу токен не восстановить.
create table if not exists public.ig_sessions (
  token_hash text primary key check (char_length(token_hash) = 64),
  parent_id uuid not null references public.ig_parents (id) on delete cascade,
  active_child_id uuid references public.ig_children (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists ig_sessions_parent_id_idx on public.ig_sessions (parent_id);
create index if not exists ig_sessions_expires_at_idx on public.ig_sessions (expires_at);

alter table public.ig_parents enable row level security;
alter table public.ig_children enable row level security;
alter table public.ig_sessions enable row level security;
alter table public.ig_parents force row level security;
alter table public.ig_children force row level security;
alter table public.ig_sessions force row level security;

revoke all on public.ig_parents, public.ig_children, public.ig_sessions from anon, authenticated;

-- ===== platform/server/migrations/002_password_reset.sql =====
-- 002: восстановление пароля по ссылке из письма.
-- В письме — случайный токен; здесь только его SHA-256, как у сессий.
-- Утечка таблицы не даёт сменить пароль: по хешу токен не восстановить.
-- Ссылка одноразовая и живёт 30 минут; после смены пароля все токены и сессии родителя удаляются.

create table if not exists public.ig_password_resets (
  token_hash text primary key check (char_length(token_hash) = 64),
  parent_id uuid not null references public.ig_parents (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists ig_password_resets_parent_id_idx on public.ig_password_resets (parent_id);
create index if not exists ig_password_resets_expires_at_idx on public.ig_password_resets (expires_at);

alter table public.ig_password_resets enable row level security;
alter table public.ig_password_resets force row level security;
revoke all on public.ig_password_resets from anon, authenticated;

-- ===== platform/server/migrations/003_parent_area.sql =====
-- 003: кабинет родителя и время детей.
-- Кабинет открывается задачей для взрослых и (по желанию) PIN; открытость хранится в серверной сессии.
-- Время в играх считает сервер по «пульсу» оболочки раз в минуту, лимиты и тихие часы задаёт родитель.
-- Всё как в 001: префикс ig_, RLS без политик, доступ только у сервера.

alter table public.ig_sessions add column if not exists parent_unlocked_until timestamptz;

create table if not exists public.ig_parent_settings (
  parent_id uuid primary key references public.ig_parents (id) on delete cascade,
  -- scrypt, как у пароля; сам PIN нигде не хранится.
  pin_hash text,
  pin_failed smallint not null default 0,
  pin_locked_until timestamptz,
  -- Фото взрослого: маленький JPEG/PNG/WebP как data URL (клиент ужимает до 256×256).
  photo text check (photo is null or (char_length(photo) <= 400000 and photo ~ '^data:image/(jpeg|png|webp);base64,')),
  -- Часовой пояс IANA: по нему считаются «сегодня», лимиты и тихие часы.
  timezone text check (timezone is null or char_length(timezone) <= 64),
  updated_at timestamptz not null default now()
);

create table if not exists public.ig_child_settings (
  child_id uuid primary key references public.ig_children (id) on delete cascade,
  lang text check (lang is null or lang in ('ru', 'uk', 'ro', 'en')),
  photo text check (photo is null or (char_length(photo) <= 400000 and photo ~ '^data:image/(jpeg|png|webp);base64,')),
  -- Минут в день; null — без ограничения.
  limit_weekday smallint check (limit_weekday is null or limit_weekday between 5 and 600),
  limit_weekend smallint check (limit_weekend is null or limit_weekend between 5 and 600),
  -- Тихие часы (могут идти через полночь: 21:00–07:00); оба null — выключены.
  quiet_from time,
  quiet_to time,
  -- Напоминание о перерыве каждые N минут игры; 0 — не напоминать.
  break_every smallint not null default 0 check (break_every between 0 and 120),
  -- Можно ли попросить у взрослого ещё времени.
  can_ask boolean not null default true,
  last_beat_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Ручные исключения из правила «игры по возрасту». Нет строки — решает возраст.
create table if not exists public.ig_child_game_access (
  child_id uuid not null references public.ig_children (id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9-]{1,40}$'),
  allowed boolean not null,
  primary key (child_id, game_id)
);

-- Секунды в игре по дням (день — по часовому поясу родителя).
create table if not exists public.ig_play_daily (
  child_id uuid not null references public.ig_children (id) on delete cascade,
  day date not null,
  game_id text not null check (game_id ~ '^[a-z0-9-]{1,40}$'),
  seconds integer not null default 0 check (seconds >= 0),
  primary key (child_id, day, game_id)
);

-- Просьбы «ещё N минут» и прибавки от взрослого (from_parent). Одобренные минуты дня прибавляются к лимиту.
create table if not exists public.ig_time_requests (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.ig_children (id) on delete cascade,
  day date not null,
  minutes smallint not null check (minutes between 5 and 120),
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  from_parent boolean not null default false,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index if not exists ig_time_requests_child_day_idx on public.ig_time_requests (child_id, day);

alter table public.ig_parent_settings enable row level security;
alter table public.ig_child_settings enable row level security;
alter table public.ig_child_game_access enable row level security;
alter table public.ig_play_daily enable row level security;
alter table public.ig_time_requests enable row level security;
alter table public.ig_parent_settings force row level security;
alter table public.ig_child_settings force row level security;
alter table public.ig_child_game_access force row level security;
alter table public.ig_play_daily force row level security;
alter table public.ig_time_requests force row level security;

revoke all on public.ig_parent_settings, public.ig_child_settings, public.ig_child_game_access,
  public.ig_play_daily, public.ig_time_requests from anon, authenticated;

-- ===== platform/server/migrations/004_progress_family.sql =====
-- 004: успехи в играх, облачные сохранения, удобство для малышей, письма родителю, помощники семьи.
-- Всё как в 001: префикс ig_, RLS без политик, доступ только у сервера.

-- Удобство и возраст ребёнка.
alter table public.ig_child_settings add column if not exists toddler boolean;
-- Месяц рождения (первое число месяца). По нему возраст растёт сам; null — берём ig_children.age.
alter table public.ig_child_settings add column if not exists birth_month date;
-- Громкость музыки и эффектов, 0–100.
alter table public.ig_child_settings add column if not exists music_volume smallint not null default 80 check (music_volume between 0 and 100);
alter table public.ig_child_settings add column if not exists effects_volume smallint not null default 100 check (effects_volume between 0 and 100);
alter table public.ig_child_settings add column if not exists reduce_motion boolean not null default false;
alter table public.ig_child_settings add column if not exists big_buttons boolean not null default false;

-- Письма родителю: еженедельный отчёт и просьбы о времени.
alter table public.ig_parent_settings add column if not exists weekly_report boolean not null default false;
alter table public.ig_parent_settings add column if not exists notify_requests boolean not null default true;
alter table public.ig_parent_settings add column if not exists report_sent_on date;
alter table public.ig_parent_settings add column if not exists onboarded boolean not null default false;
-- Язык писем родителю (ru, uk, ro, en).
alter table public.ig_parent_settings add column if not exists mail_locale text check (mail_locale is null or mail_locale in ('ru', 'uk', 'ro', 'en'));

-- События игр: пройденный уровень и ответы по навыкам. Игра шлёт их через SDK (sdk.progress).
create table if not exists public.ig_play_events (
  id bigint generated always as identity primary key,
  child_id uuid not null references public.ig_children (id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9-]{1,40}$'),
  kind text not null check (kind in ('level', 'skill')),
  -- Для level — номер или имя уровня, для skill — навык: count, letters, colors, shapes…
  name text not null check (char_length(name) between 1 and 40),
  ok boolean,
  created_at timestamptz not null default now()
);
create index if not exists ig_play_events_child_idx on public.ig_play_events (child_id, created_at);

-- Наклейки из всех игр: одна наклейка — одна строка навсегда.
create table if not exists public.ig_stickers (
  child_id uuid not null references public.ig_children (id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9-]{1,40}$'),
  sticker text not null check (sticker ~ '^[a-z0-9-]{1,40}$'),
  earned_at timestamptz not null default now(),
  seen boolean not null default false,
  primary key (child_id, game_id, sticker)
);

-- Облачные сохранения для игр без своего сервера (sdk.cloud): ключ-значение по ребёнку и игре.
create table if not exists public.ig_cloud_saves (
  child_id uuid not null references public.ig_children (id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9-]{1,40}$'),
  key text not null check (key ~ '^[a-zA-Z0-9:_-]{1,60}$'),
  value jsonb not null check (pg_column_size(value) <= 65536),
  updated_at timestamptz not null default now(),
  primary key (child_id, game_id, key)
);

-- Помощники семьи (бабушка, няня): отвечают на просьбы о времени по секретной ссылке, без пароля.
create table if not exists public.ig_helpers (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.ig_parents (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  email text check (email is null or (email = lower(email) and char_length(email) between 3 and 254)),
  -- В ссылке случайный токен; здесь только его SHA-256.
  token_hash text not null unique check (char_length(token_hash) = 64),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists ig_helpers_parent_idx on public.ig_helpers (parent_id);

alter table public.ig_play_events enable row level security;
alter table public.ig_stickers enable row level security;
alter table public.ig_cloud_saves enable row level security;
alter table public.ig_helpers enable row level security;
alter table public.ig_play_events force row level security;
alter table public.ig_stickers force row level security;
alter table public.ig_cloud_saves force row level security;
alter table public.ig_helpers force row level security;

revoke all on public.ig_play_events, public.ig_stickers, public.ig_cloud_saves, public.ig_helpers from anon, authenticated;

-- ===== platform/server/migrations/005_day_plan.sql =====
-- 005: план дня от взрослого — до трёх игр, которые ребёнок видит наверху дашборда.
-- Как в 001: префикс ig_, RLS без политик, доступ только у сервера. Скрипт идемпотентный.

alter table public.ig_child_settings add column if not exists day_plan text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ig_child_settings_day_plan_check') then
    alter table public.ig_child_settings
      add constraint ig_child_settings_day_plan_check check (cardinality(day_plan) <= 3);
  end if;
end $$;

-- ===== platform/server/migrations/006_switch_once.sql =====
-- 006: разовое разрешение взрослого на смену профиля ребёнка.
-- Раньше задача для взрослого при смене профиля открывала весь кабинет на 15 минут,
-- и ребёнок мог зайти в кабинет следом. Теперь она даёт одну смену профиля в течение минуты.
-- Заодно уточнение к 003: строка ig_child_game_access — ручное «можно/нельзя»; без строки игра открыта,
-- а возраст только сортирует меню (игры по возрасту выше).
-- Как в 001: префикс ig_, RLS без политик, доступ только у сервера. Скрипт идемпотентный.

alter table public.ig_sessions add column if not exists switch_allowed_until timestamptz;

-- ===== platform/server/migrations/007_profiles.sql =====
-- 007: логика профилей детей.
-- Замок на вход в профиль и на выход из него, лимит на каждый день недели, мягкое удаление профиля
-- (30 дней в корзине), «кто играет?» после перерыва, согласие родителя, срок хранения неактивных
-- аккаунтов, помощники только для выбранных детей.
-- Как в 001: префикс ig_, RLS без политик, доступ только у сервера. Скрипт идемпотентный.

-- Вход в профиль только со взрослым (старший без лимита) и выход только со взрослым (устройство одного ребёнка).
alter table public.ig_child_settings add column if not exists locked boolean not null default false;
alter table public.ig_child_settings add column if not exists exit_lock boolean not null default false;

-- Лимит минут на каждый день недели: 7 чисел с воскресенья (0) по субботу (6); 0 — в этот день без лимита.
-- null — работают прежние limit_weekday и limit_weekend.
alter table public.ig_child_settings add column if not exists limit_days smallint[];
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ig_child_settings_limit_days_check') then
    alter table public.ig_child_settings
      add constraint ig_child_settings_limit_days_check
      check (limit_days is null or (cardinality(limit_days) = 7 and 0 <= all (limit_days) and 600 >= all (limit_days)));
  end if;
end $$;

-- Удалённый профиль 30 дней лежит в корзине: его можно вернуть, потом чистка стирает его каскадом.
alter table public.ig_children add column if not exists deleted_at timestamptz;
create index if not exists ig_children_deleted_at_idx on public.ig_children (deleted_at) where deleted_at is not null;

-- Когда на этом устройстве последний раз выбирали профиль: после долгого перерыва спрашиваем «кто играет?».
alter table public.ig_sessions add column if not exists child_seen_at timestamptz;

-- Согласие взрослого при регистрации: когда и с какой редакцией политики. У старых аккаунтов null.
alter table public.ig_parents add column if not exists consent_at timestamptz;
alter table public.ig_parents add column if not exists policy_version text check (policy_version is null or char_length(policy_version) <= 20);
-- Срок хранения: когда взрослый последний раз входил и когда мы предупредили о скором удалении.
alter table public.ig_parents add column if not exists last_seen_at timestamptz not null default now();
alter table public.ig_parents add column if not exists inactive_warned_at timestamptz;
create index if not exists ig_parents_last_seen_at_idx on public.ig_parents (last_seen_at);

-- Помощник семьи только для выбранных детей; null — для всех.
alter table public.ig_helpers add column if not exists child_ids uuid[];

-- ===== platform/server/migrations/008_admin.sql =====
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

-- ===== games/animal-orchestra/server/migrations/001_melodies.sql =====
-- Звериный оркестр: мелодии детей (до 30 на ребёнка, лишние удаляет сервер игры).
-- Таблица только этой игры (префикс ig_game_animal_orchestra_).
create table if not exists public.ig_game_animal_orchestra_melodies (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.ig_children (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  -- [{ a: id зверя, t: мс от начала, m: 'instrument' | 'voice' }]; форму проверяет сервер игры.
  notes jsonb not null check (jsonb_typeof(notes) = 'array'),
  created_at timestamptz not null default now()
);
create index if not exists ig_game_animal_orchestra_melodies_child_idx
  on public.ig_game_animal_orchestra_melodies (child_id, created_at desc);

alter table public.ig_game_animal_orchestra_melodies enable row level security;
alter table public.ig_game_animal_orchestra_melodies force row level security;
revoke all on public.ig_game_animal_orchestra_melodies from anon, authenticated;

-- ===== games/drawing/server/migrations/001_drawings.sql =====
-- Рисовалка: рисунки детей. Таблица только этой игры (префикс ig_game_drawing_).
create table if not exists public.ig_game_drawing_drawings (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.ig_children (id) on delete cascade,
  title text not null check (char_length(title) <= 80),
  -- PNG как data URL; сервер игры принимает тело до 10 МБ.
  image text not null check (image like 'data:image/png;base64,%'),
  created_at timestamptz not null default now()
);
create index if not exists ig_game_drawing_drawings_child_idx on public.ig_game_drawing_drawings (child_id, created_at desc);

alter table public.ig_game_drawing_drawings enable row level security;
alter table public.ig_game_drawing_drawings force row level security;
revoke all on public.ig_game_drawing_drawings from anon, authenticated;

-- ===== games/island-builder/server/migrations/001_islands.sql =====
-- Остров-конструктор: один сохранённый остров на ребёнка. Таблица только этой игры (префикс ig_game_island_builder_).
create table if not exists public.ig_game_island_builder_islands (
  child_id uuid primary key references public.ig_children (id) on delete cascade,
  -- SaveData игры (v, blocks, trees, stats, night, achieved); форму проверяет сервер игры.
  island jsonb not null check (pg_column_size(island) <= 524288),
  updated_at timestamptz not null default now()
);

alter table public.ig_game_island_builder_islands enable row level security;
alter table public.ig_game_island_builder_islands force row level security;
revoke all on public.ig_game_island_builder_islands from anon, authenticated;

-- ===== games/letter-eater/server/migrations/001_progress.sql =====
-- Буквоед: звёзды по уровням для каждого ребёнка. Таблица только этой игры (префикс ig_game_letter_eater_).
create table if not exists public.ig_game_letter_eater_progress (
  child_id uuid primary key references public.ig_children (id) on delete cascade,
  -- stars[i] — лучшие звёзды (0..3) за уровень i.
  stars smallint[] not null check (cardinality(stars) <= 50),
  updated_at timestamptz not null default now()
);

alter table public.ig_game_letter_eater_progress enable row level security;
alter table public.ig_game_letter_eater_progress force row level security;
revoke all on public.ig_game_letter_eater_progress from anon, authenticated;

-- ===== games/moon-valley/server/migrations/001_saves.sql =====
-- Лунная Долина: одно сохранение на ребёнка. Таблица только этой игры (префикс ig_game_moon_valley_).
create table if not exists public.ig_game_moon_valley_saves (
  child_id uuid primary key references public.ig_children (id) on delete cascade,
  -- ValleyState игры (уровень, ресурсы, сад, питомцы, квесты); форму проверяет сервер игры.
  save jsonb not null check (pg_column_size(save) <= 32768),
  updated_at timestamptz not null default now()
);

alter table public.ig_game_moon_valley_saves enable row level security;
alter table public.ig_game_moon_valley_saves force row level security;
revoke all on public.ig_game_moon_valley_saves from anon, authenticated;

-- ===== games/space-gardener/server/migrations/001_levels.sql =====
-- Космический садовник: лучшие звёзды за каждый уровень. Таблица только этой игры (префикс ig_game_space_gardener_).
create table if not exists public.ig_game_space_gardener_levels (
  child_id uuid not null references public.ig_children (id) on delete cascade,
  level_id text not null check (level_id ~ '^[a-z0-9-]{1,40}$'),
  stars smallint not null check (stars between 1 and 3),
  updated_at timestamptz not null default now(),
  primary key (child_id, level_id)
);

alter table public.ig_game_space_gardener_levels enable row level security;
alter table public.ig_game_space_gardener_levels force row level security;
revoke all on public.ig_game_space_gardener_levels from anon, authenticated;

-- ===== games/who-lives-where/server/migrations/001_progress.sql =====
-- «Кто где живёт»: прогресс ребёнка. Таблица только этой игры (префикс ig_game_who_lives_where_).
create table if not exists public.ig_game_who_lives_where_progress (
  child_id uuid primary key references public.ig_children (id) on delete cascade,
  level smallint not null default 1 check (level between 1 and 100),
  found text[] not null default '{}' check (cardinality(found) <= 200),
  updated_at timestamptz not null default now()
);

alter table public.ig_game_who_lives_where_progress enable row level security;
alter table public.ig_game_who_lives_where_progress force row level security;
revoke all on public.ig_game_who_lives_where_progress from anon, authenticated;

