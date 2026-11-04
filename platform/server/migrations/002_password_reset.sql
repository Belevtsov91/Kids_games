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
