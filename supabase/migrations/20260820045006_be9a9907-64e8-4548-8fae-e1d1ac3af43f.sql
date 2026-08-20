create or replace function public.current_user_has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = _role
  )
$$;

create or replace function public.current_user_has_any_role(_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = any(_roles)
  )
$$;

create or replace function public.current_user_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('super_admin','management','sales','operations','finance','read_only')
  )
$$;

revoke all on function public.current_user_has_role(public.app_role) from public, anon;
revoke all on function public.current_user_has_any_role(public.app_role[]) from public, anon;
revoke all on function public.current_user_is_staff() from public, anon;

grant execute on function public.current_user_has_role(public.app_role) to authenticated, service_role;
grant execute on function public.current_user_has_any_role(public.app_role[]) to authenticated, service_role;
grant execute on function public.current_user_is_staff() to authenticated, service_role;