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
