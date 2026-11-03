-- Звериный оркестр: мелодии детей (до 30 на ребёнка, лишние удаляет сервер игры).
-- Таблица только этой игры (префикс ig_game_animal_orchestra_).
create table if not exists public.ig_game_animal_orchestra_melodies (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.ig_children (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  -- [{ a: id зверя, t: мс от начала, m: 'instrument' | 'voice' }]; форму проверяет сервер игры.
  notes jsonb not null check (jsonb_typeof(notes) = 'array'),
  created_at timestamptz not null default now()
);
create index if not exists ig_game_animal_orchestra_melodies_child_idx
  on public.ig_game_animal_orchestra_melodies (child_id, created_at desc);

alter table public.ig_game_animal_orchestra_melodies enable row level security;
alter table public.ig_game_animal_orchestra_melodies force row level security;
revoke all on public.ig_game_animal_orchestra_melodies from anon, authenticated;
