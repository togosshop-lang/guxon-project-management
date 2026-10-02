alter table public.projects
  add column if not exists strategy_start_date date null,
  add column if not exists strategy_assignee_id bigint null references public.employees(id) on delete set null,
  add column if not exists image_url text null;

create index if not exists projects_strategy_assignee_id_idx
  on public.projects (strategy_assignee_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read"
on storage.objects for select
using (bucket_id = 'product-images');

drop policy if exists "product images authenticated insert" on storage.objects;
create policy "product images authenticated insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

drop policy if exists "product images authenticated update" on storage.objects;
create policy "product images authenticated update"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

drop policy if exists "product images authenticated delete" on storage.objects;
create policy "product images authenticated delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images');
