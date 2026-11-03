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
