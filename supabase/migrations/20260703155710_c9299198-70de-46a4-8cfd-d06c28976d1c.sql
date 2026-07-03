
-- Roles enum + table
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view their own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Header logo telemetry
create table public.header_logo_events (
  id bigserial primary key,
  event_type text not null check (event_type in ('render','error')),
  variant text,
  stage text,
  device_width integer,
  dpr numeric,
  correlation_id text,
  sample_rate numeric,
  src text,
  next_src text,
  natural_width integer,
  natural_height integer,
  online boolean,
  route text,
  url text,
  ua text,
  release text,
  ip text,
  client_ts timestamptz,
  created_at timestamptz not null default now()
);

create index header_logo_events_created_at_idx on public.header_logo_events (created_at desc);
create index header_logo_events_event_type_idx on public.header_logo_events (event_type);
create index header_logo_events_variant_idx on public.header_logo_events (variant);
create index header_logo_events_correlation_id_idx on public.header_logo_events (correlation_id);

grant insert on public.header_logo_events to anon, authenticated;
grant usage, select on sequence public.header_logo_events_id_seq to anon, authenticated;
grant all on public.header_logo_events to service_role;
grant all on sequence public.header_logo_events_id_seq to service_role;

alter table public.header_logo_events enable row level security;

create policy "Anyone can insert logo events"
  on public.header_logo_events for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read logo events"
  on public.header_logo_events for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));
