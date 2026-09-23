-- GUXON 新品管理平台｜正式雲端登入安全設定
-- 前提：每位可登入員工已存在 public.employees，且 active=true。
-- 建議 auth_user_id 已綁定 auth.users.id；Email 同時保留作為備援。

alter table public.employees add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

create or replace function public.is_active_guxon_employee()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.employees e
    where e.active = true
      and (
        e.auth_user_id = auth.uid()
        or (e.auth_user_id is null and lower(coalesce(e.email,'')) = lower(coalesce(auth.jwt() ->> 'email','')))
      )
  );
$$;

grant execute on function public.is_active_guxon_employee() to authenticated;

-- 確保所有正式使用資料表都有 RLS
alter table public.projects enable row level security;
alter table public.stages enable row level security;
alter table public.tasks enable row level security;
alter table public.employees enable row level security;
alter table public.stage_gates enable row level security;
alter table public.execution_sections enable row level security;
alter table public.execution_tasks enable row level security;
alter table public.execution_template_defaults enable row level security;

-- 移除已知開發／匿名 policy
drop policy if exists "guxon_v1_projects" on public.projects;
drop policy if exists "guxon_v1_stages" on public.stages;
drop policy if exists "guxon_v1_tasks" on public.tasks;
drop policy if exists "guxon_v1_employees" on public.employees;
drop policy if exists "guxon_v1_gates" on public.stage_gates;
drop policy if exists "guxon_execution_sections" on public.execution_sections;
drop policy if exists "guxon_execution_tasks" on public.execution_tasks;
drop policy if exists "allow public read projects" on public.projects;
drop policy if exists "allow public read stages" on public.stages;
drop policy if exists "allow public read tasks" on public.tasks;
drop policy if exists "allow public update tasks" on public.tasks;
drop policy if exists "v1_projects_all" on public.projects;
drop policy if exists "v1_stages_all" on public.stages;
drop policy if exists "v1_tasks_all" on public.tasks;
drop policy if exists "v1_employees_all" on public.employees;

-- 正式 authenticated policies
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects','stages','tasks','employees','stage_gates','execution_sections','execution_tasks','execution_template_defaults']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'guxon_secure_'||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_active_guxon_employee()) WITH CHECK (public.is_active_guxon_employee())', 'guxon_secure_'||t, t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
