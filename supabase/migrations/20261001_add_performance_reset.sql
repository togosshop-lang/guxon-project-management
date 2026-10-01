create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by bigint null
);

insert into public.app_settings (key, value)
values ('performance_reset', jsonb_build_object('reset_at', null))
on conflict (key) do nothing;
