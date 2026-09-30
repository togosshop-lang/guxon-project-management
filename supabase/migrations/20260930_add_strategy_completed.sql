alter table public.projects
  add column if not exists strategy_completed boolean not null default false,
  add column if not exists strategy_completed_at timestamptz;
