-- Tighten insert policies (no more WITH CHECK true) and stop exposing has_role via the Data API.

drop policy if exists "Anyone can submit inquiries" on public.project_inquiries;
create policy "Anyone can submit inquiries"
  on public.project_inquiries for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 200
    and char_length(email) between 3 and 320
    and email like '%_@_%.__%'
    and (message is null or char_length(message) <= 5000)
    and (phone is null or char_length(phone) <= 40)
    and (company is null or char_length(company) <= 200)
    and (country is null or char_length(country) <= 100)
    and (application is null or char_length(application) <= 200)
    and (source_page is null or char_length(source_page) <= 300)
    and (calculator_state is null or octet_length(calculator_state::text) <= 32768)
  );

drop policy if exists "Anyone can log downloads" on public.download_events;
create policy "Anyone can log downloads"
  on public.download_events for insert
  to anon, authenticated
  with check (
    char_length(document_id) between 1 and 200
    and (document_title is null or char_length(document_title) <= 300)
    and (category is null or char_length(category) <= 100)
    and (source_page is null or char_length(source_page) <= 300)
  );

alter table public.project_inquiries
  drop constraint if exists project_inquiries_calc_state_size;
alter table public.project_inquiries
  add constraint project_inquiries_calc_state_size
  check (calculator_state is null or octet_length(calculator_state::text) <= 32768);

-- Inline the admin check in each policy that used public.has_role(),
-- so we can revoke EXECUTE on has_role from signed-in users.
drop policy if exists "Admins can view inquiries" on public.project_inquiries;
create policy "Admins can view inquiries"
  on public.project_inquiries for select
  to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can update inquiries" on public.project_inquiries;
create policy "Admins can update inquiries"
  on public.project_inquiries for update
  to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can view downloads" on public.download_events;
create policy "Admins can view downloads"
  on public.download_events for select
  to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can read logo events" on public.header_logo_events;
create policy "Admins can read logo events"
  on public.header_logo_events for select
  to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can read solutions_inspection" on public.solutions_inspection;
create policy "Admins can read solutions_inspection"
  on public.solutions_inspection for select
  to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can insert solutions_inspection" on public.solutions_inspection;
create policy "Admins can insert solutions_inspection"
  on public.solutions_inspection for insert
  to authenticated
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can update solutions_inspection" on public.solutions_inspection;
create policy "Admins can update solutions_inspection"
  on public.solutions_inspection for update
  to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;
