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
