-- Бит-студия: биты детей (до 30 на ребёнка, лишние удаляет сервер игры).
-- Таблица только этой игры (префикс ig_game_studio_).
create table if not exists public.ig_game_studio_beats (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.ig_children (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  bpm smallint not null check (bpm between 60 and 180),
  swing real not null default 0 check (swing between 0 and 0.5),
  -- 16 чисел, по одному на пэд: 16-битная маска шагов. Форму проверяет сервер игры.
  pattern jsonb not null check (jsonb_typeof(pattern) = 'array' and jsonb_array_length(pattern) = 16),
  -- Ребёнок нажал «Показать родителям»: бит виден взрослому в кабинете.
  shared boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ig_game_studio_beats_child_idx
  on public.ig_game_studio_beats (child_id, created_at desc);

alter table public.ig_game_studio_beats enable row level security;
alter table public.ig_game_studio_beats force row level security;
revoke all on public.ig_game_studio_beats from anon, authenticated;
