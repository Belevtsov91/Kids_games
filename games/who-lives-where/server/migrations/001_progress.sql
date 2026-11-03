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
