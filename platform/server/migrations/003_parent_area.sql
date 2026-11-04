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
