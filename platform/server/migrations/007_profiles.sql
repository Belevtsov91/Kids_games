-- 007: логика профилей детей.
-- Замок на вход в профиль и на выход из него, лимит на каждый день недели, мягкое удаление профиля
-- (30 дней в корзине), «кто играет?» после перерыва, согласие родителя, срок хранения неактивных
-- аккаунтов, помощники только для выбранных детей.
-- Как в 001: префикс ig_, RLS без политик, доступ только у сервера. Скрипт идемпотентный.

-- Вход в профиль только со взрослым (старший без лимита) и выход только со взрослым (устройство одного ребёнка).
alter table public.ig_child_settings add column if not exists locked boolean not null default false;
alter table public.ig_child_settings add column if not exists exit_lock boolean not null default false;

-- Лимит минут на каждый день недели: 7 чисел с воскресенья (0) по субботу (6); 0 — в этот день без лимита.
-- null — работают прежние limit_weekday и limit_weekend.
alter table public.ig_child_settings add column if not exists limit_days smallint[];
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ig_child_settings_limit_days_check') then
    alter table public.ig_child_settings
      add constraint ig_child_settings_limit_days_check
      check (limit_days is null or (cardinality(limit_days) = 7 and 0 <= all (limit_days) and 600 >= all (limit_days)));
  end if;
end $$;

-- Удалённый профиль 30 дней лежит в корзине: его можно вернуть, потом чистка стирает его каскадом.
alter table public.ig_children add column if not exists deleted_at timestamptz;
create index if not exists ig_children_deleted_at_idx on public.ig_children (deleted_at) where deleted_at is not null;

-- Когда на этом устройстве последний раз выбирали профиль: после долгого перерыва спрашиваем «кто играет?».
alter table public.ig_sessions add column if not exists child_seen_at timestamptz;

-- Согласие взрослого при регистрации: когда и с какой редакцией политики. У старых аккаунтов null.
alter table public.ig_parents add column if not exists consent_at timestamptz;
alter table public.ig_parents add column if not exists policy_version text check (policy_version is null or char_length(policy_version) <= 20);
-- Срок хранения: когда взрослый последний раз входил и когда мы предупредили о скором удалении.
alter table public.ig_parents add column if not exists last_seen_at timestamptz not null default now();
alter table public.ig_parents add column if not exists inactive_warned_at timestamptz;
create index if not exists ig_parents_last_seen_at_idx on public.ig_parents (last_seen_at);

-- Помощник семьи только для выбранных детей; null — для всех.
alter table public.ig_helpers add column if not exists child_ids uuid[];
