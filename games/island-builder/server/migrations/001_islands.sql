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
