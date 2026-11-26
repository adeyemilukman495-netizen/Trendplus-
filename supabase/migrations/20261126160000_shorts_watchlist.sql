-- Save Shorts independently from catalogue watchlist titles.
create table if not exists public.short_watchlist (
  user_id uuid not null references public.profiles(id) on delete cascade,
  short_id uuid not null references public.shorts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, short_id)
);
create index if not exists short_watchlist_user_created_idx
  on public.short_watchlist(user_id, created_at desc);
alter table public.short_watchlist enable row level security;
drop policy if exists "Members read their saved Shorts" on public.short_watchlist;
create policy "Members read their saved Shorts"
  on public.short_watchlist for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Members save Shorts for themselves" on public.short_watchlist;
create policy "Members save Shorts for themselves"
  on public.short_watchlist for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Members remove their saved Shorts" on public.short_watchlist;
create policy "Members remove their saved Shorts"
  on public.short_watchlist for delete to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.short_watchlist from anon, authenticated;
grant select, insert, delete on public.short_watchlist to authenticated;
