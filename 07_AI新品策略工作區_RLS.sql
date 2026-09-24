-- GUXON AI 新品策略工作區 RLS Policies
-- 前提：06_AI新品策略工作區.sql 已執行，且新表已啟用 RLS。
-- 目前專案前端需要直接讀寫這些資料，因此沿用現有內部系統的寬鬆存取模式。
-- 日後若全面啟用正式登入，可再收緊為 authenticated / user-specific policies。

alter table public.strategy_sections enable row level security;
alter table public.strategy_items enable row level security;
alter table public.strategy_dependencies enable row level security;
alter table public.strategy_reports enable row level security;

-- 先刪除同名 policy，確保本檔可重複執行。
drop policy if exists "strategy_sections_select" on public.strategy_sections;
drop policy if exists "strategy_sections_write" on public.strategy_sections;
drop policy if exists "strategy_items_select" on public.strategy_items;
drop policy if exists "strategy_items_write" on public.strategy_items;
drop policy if exists "strategy_dependencies_select" on public.strategy_dependencies;
drop policy if exists "strategy_dependencies_write" on public.strategy_dependencies;
drop policy if exists "strategy_reports_select" on public.strategy_reports;
drop policy if exists "strategy_reports_write" on public.strategy_reports;

create policy "strategy_sections_select"
on public.strategy_sections
for select
using (true);

create policy "strategy_sections_write"
on public.strategy_sections
for all
using (true)
with check (true);

create policy "strategy_items_select"
on public.strategy_items
for select
using (true);

create policy "strategy_items_write"
on public.strategy_items
for all
using (true)
with check (true);

create policy "strategy_dependencies_select"
on public.strategy_dependencies
for select
using (true);

create policy "strategy_dependencies_write"
on public.strategy_dependencies
for all
using (true)
with check (true);

create policy "strategy_reports_select"
on public.strategy_reports
for select
using (true);

create policy "strategy_reports_write"
on public.strategy_reports
for all
using (true)
with check (true);

notify pgrst, 'reload schema';
