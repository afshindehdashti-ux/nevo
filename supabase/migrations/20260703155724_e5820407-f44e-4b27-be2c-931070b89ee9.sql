
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

drop policy "Anyone can insert logo events" on public.header_logo_events;
create policy "Anyone can insert valid logo events"
  on public.header_logo_events for insert
  to anon, authenticated
  with check (event_type in ('render','error'));
