-- 009: push-уведомления родителю и задание дня для ребёнка.
-- Как в 001: префикс ig_, RLS без политик, доступ только у сервера. Скрипт идемпотентный.

-- Подписки браузеров взрослого на push (Web Push, ключи VAPID на сервере).
-- endpoint — адрес службы push браузера (Google, Mozilla, Apple); p256dh и auth — ключи шифрования
-- от браузера. Текст уведомления шифруется, служба push его не читает.
create table if not exists public.ig_push_subs (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.ig_parents (id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 10 and 1000),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  created_at timestamptz not null default now(),
  last_ok_at timestamptz
);
create index if not exists ig_push_subs_parent_idx on public.ig_push_subs (parent_id);

-- Задание дня: одна игра на день, выполнено — отметка. Серия считается по этим строкам.
-- Пропуск дня ничего не отнимает: подарки Тёпе даются за каждые 7 выполненных дней.
create table if not exists public.ig_daily_quests (
  child_id uuid not null references public.ig_children (id) on delete cascade,
  day date not null,
  game_id text not null check (char_length(game_id) between 1 and 60),
  done_at timestamptz,
  primary key (child_id, day)
);

alter table public.ig_push_subs enable row level security;
alter table public.ig_daily_quests enable row level security;
alter table public.ig_push_subs force row level security;
alter table public.ig_daily_quests force row level security;
revoke all on public.ig_push_subs, public.ig_daily_quests from anon, authenticated;
