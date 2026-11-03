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
