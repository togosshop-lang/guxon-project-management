alter table public.execution_tasks
  add column if not exists completed_at timestamptz null;

update public.execution_tasks
set completed_at = updated_at
where completed_at is null
  and status in ('已完成','完成');

create index if not exists execution_tasks_completed_at_idx
  on public.execution_tasks (completed_at);
