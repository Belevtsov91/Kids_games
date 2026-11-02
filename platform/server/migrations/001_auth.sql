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
