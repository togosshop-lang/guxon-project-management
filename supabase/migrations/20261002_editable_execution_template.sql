alter table public.execution_template_defaults
  add column if not exists template_key text,
  add column if not exists section_name text,
  add column if not exists section_description text,
  add column if not exists task_description text,
  add column if not exists sort_order integer,
  add column if not exists archived boolean not null default false;

update public.execution_template_defaults
set template_key = coalesce(template_key, task_title)
where template_key is null;

create index if not exists execution_template_defaults_kind_key_idx
  on public.execution_template_defaults(project_kind, template_key);
