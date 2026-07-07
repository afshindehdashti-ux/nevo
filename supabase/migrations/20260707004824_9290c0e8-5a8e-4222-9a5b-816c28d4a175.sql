revoke execute on function public.has_admin_role(text) from public, anon;
grant execute on function public.has_admin_role(text) to authenticated;