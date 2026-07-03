create table if not exists public.solutions_inspection (
  id uuid primary key default gen_random_uuid(),
  locale text not null,
  path text not null,
  url text not null,
  verdict text,
  coverage_state text,
  indexing_state text,
  mobile_verdict text,
  rich_verdict text,
  google_canonical text,
  rich_detail jsonb not null default '{}'::jsonb,
  last_error text,
  inspected_at timestamptz not null default now(),
  unique (locale, path)
);

grant select, insert, update, delete on public.solutions_inspection to authenticated;
grant all on public.solutions_inspection to service_role;

alter table public.solutions_inspection enable row level security;

create policy "Admins can read solutions_inspection"
  on public.solutions_inspection for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert solutions_inspection"
  on public.solutions_inspection for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update solutions_inspection"
  on public.solutions_inspection for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists solutions_inspection_inspected_at_idx
  on public.solutions_inspection (inspected_at desc);