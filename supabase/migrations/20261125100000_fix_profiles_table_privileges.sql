-- TrendPulse: restore the table privileges required by the browser profile client.
-- Row-level security remains enabled and limits writes to the signed-in user's own row.
grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "Members create their own profile" on public.profiles;
create policy "Members create their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "Members update their own profile" on public.profiles;
create policy "Members update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
