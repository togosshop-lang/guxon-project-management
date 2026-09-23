-- 選用：準備正式對外部署、要求員工登入時才執行。
-- 執行前：
-- 1. 在 employees 表把每位員工的 email 填完整。
-- 2. .env.local 加上 NEXT_PUBLIC_REQUIRE_AUTH=true
-- 3. 員工以相同 Email 在登入頁建立 Supabase Auth 帳號。

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
      and lower(e.email) = lower(coalesce(auth.jwt() ->> 'email',''))
  );
$$;

grant execute on function public.is_active_guxon_employee() to authenticated;

-- 關閉 V1 的匿名 CRUD policy
drop policy if exists "guxon_v1_projects" on public.projects;
drop policy if exists "guxon_v1_stages" on public.stages;
drop policy if exists "guxon_v1_tasks" on public.tasks;
drop policy if exists "guxon_v1_employees" on public.employees;
drop policy if exists "guxon_v1_gates" on public.stage_gates;
drop policy if exists "guxon_execution_sections" on public.execution_sections;
drop policy if exists "guxon_execution_tasks" on public.execution_tasks;

-- 登入且 Email 存在 employees 才可操作
drop policy if exists "guxon_secure_projects" on public.projects;
drop policy if exists "guxon_secure_stages" on public.stages;
drop policy if exists "guxon_secure_tasks" on public.tasks;
drop policy if exists "guxon_secure_employees" on public.employees;
drop policy if exists "guxon_secure_gates" on public.stage_gates;
drop policy if exists "guxon_secure_execution_sections" on public.execution_sections;
drop policy if exists "guxon_secure_execution_tasks" on public.execution_tasks;

create policy "guxon_secure_projects" on public.projects for all to authenticated using (public.is_active_guxon_employee()) with check (public.is_active_guxon_employee());
create policy "guxon_secure_stages" on public.stages for all to authenticated using (public.is_active_guxon_employee()) with check (public.is_active_guxon_employee());
create policy "guxon_secure_tasks" on public.tasks for all to authenticated using (public.is_active_guxon_employee()) with check (public.is_active_guxon_employee());
create policy "guxon_secure_employees" on public.employees for all to authenticated using (public.is_active_guxon_employee()) with check (public.is_active_guxon_employee());
create policy "guxon_secure_gates" on public.stage_gates for all to authenticated using (public.is_active_guxon_employee()) with check (public.is_active_guxon_employee());
create policy "guxon_secure_execution_sections" on public.execution_sections for all to authenticated using (public.is_active_guxon_employee()) with check (public.is_active_guxon_employee());
create policy "guxon_secure_execution_tasks" on public.execution_tasks for all to authenticated using (public.is_active_guxon_employee()) with check (public.is_active_guxon_employee());

-- 清除開發過程可能曾建立的舊匿名 policies，避免安全模式仍被舊 policy 放行。
drop policy if exists "allow public read projects" on public.projects;
drop policy if exists "allow public read stages" on public.stages;
drop policy if exists "allow public read tasks" on public.tasks;
drop policy if exists "allow public update tasks" on public.tasks;
drop policy if exists "v1_projects_all" on public.projects;
drop policy if exists "v1_stages_all" on public.stages;
drop policy if exists "v1_tasks_all" on public.tasks;
drop policy if exists "v1_employees_all" on public.employees;
