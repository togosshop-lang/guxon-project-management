alter table public.projects
  add column if not exists strategy_due_date date;
