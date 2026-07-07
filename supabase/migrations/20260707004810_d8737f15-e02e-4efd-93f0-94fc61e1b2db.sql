alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_admin_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and (role::text = required_role or role = 'super_admin'::app_role)
  );
$$;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.has_admin_role('management')
  or public.has_admin_role('super_admin')
);

drop policy if exists "Users can read own roles" on public.user_roles;
create policy "Users can read own roles"
on public.user_roles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_admin_role('management')
  or public.has_admin_role('super_admin')
);