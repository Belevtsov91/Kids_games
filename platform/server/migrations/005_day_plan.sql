-- 005: план дня от взрослого — до трёх игр, которые ребёнок видит наверху дашборда.
-- Как в 001: префикс ig_, RLS без политик, доступ только у сервера. Скрипт идемпотентный.

alter table public.ig_child_settings add column if not exists day_plan text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ig_child_settings_day_plan_check') then
    alter table public.ig_child_settings
      add constraint ig_child_settings_day_plan_check check (cardinality(day_plan) <= 3);
  end if;
end $$;
