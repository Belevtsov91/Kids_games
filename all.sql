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

