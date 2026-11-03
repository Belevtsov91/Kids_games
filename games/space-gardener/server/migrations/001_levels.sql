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
